import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCheckoutPayment, DokuError, getOrderStatus } from "@/lib/doku/client";

const INVOICE_RE = /^(SIRA-[A-F0-9]{8})(?:-(\d{1,2}))?$/;
const MAX_ATTEMPTS = 5;

/** Invoice DOKU: percobaan ke-1 = kode pesanan; berikutnya diberi akhiran -N agar tidak bentrok. */
export const invoiceFor = (orderCode: string, attempt: number) => (attempt <= 1 ? orderCode : `${orderCode}-${attempt}`);
export const orderCodeFromInvoice = (invoice: string) => INVOICE_RE.exec(invoice)?.[1] ?? null;

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const paymentMethods = () =>
  (process.env.DOKU_PAYMENT_METHODS ?? "QRIS").split(",").map((m) => m.trim().toUpperCase()).filter((m) => /^[A-Z_]+$/.test(m));
const dueMinutes = () => Math.min(1440, Math.max(10, Number(process.env.DOKU_PAYMENT_DUE_MINUTES) || 60));

/** Kolom/tabel belum ada (migrasi belum dijalankan) dibedakan dari "pesanan tidak ada". */
export function dbErrorMessage(e: { code?: string; message?: string }) {
  const missing = e.code === "42703" || e.code === "PGRST204" || e.code === "PGRST200" || /payment_(url|attempts|expires_at|checked_at|provider)/.test(e.message ?? "");
  return missing
    ? "Database belum diperbarui: jalankan migrasi supabase/migrations/0009_doku_payments.sql."
    : "Gagal membaca data pesanan. Silakan coba lagi.";
}

type LinkResult = { ok: true; url: string; expiresAt: string | null } | { ok: false; error: string; detail?: string };

// Popup (default) memakai jokul-checkout-1.0.0.js; atur DOKU_CHECKOUT_MODE=redirect untuk pindah halaman penuh.
export function checkoutPresentation(): { mode: "popup" | "redirect"; sdkUrl: string | null } {
  const mode = process.env.DOKU_CHECKOUT_MODE === "redirect" ? "redirect" : "popup";
  const sdkUrl = process.env.DOKU_ENV === "production"
    ? "https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js"
    : "https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js";
  return { mode, sdkUrl: mode === "popup" ? sdkUrl : null };
}

/** Mengembalikan tautan pembayaran aktif; membuat yang baru jika belum ada / hampir kedaluwarsa. */
export async function ensurePaymentLink(orderCode: string): Promise<LinkResult> {
  const admin = createAdminClient();
  const { data: o, error: readErr } = await admin.from("orders")
    .select("id, order_code, total, status, customer_name, customer_email, customer_phone, payment_url, payment_expires_at, payment_attempts")
    .eq("order_code", orderCode).maybeSingle();
  if (readErr) {
    console.error("ensurePaymentLink (baca pesanan):", readErr);
    return { ok: false, error: dbErrorMessage(readErr), detail: readErr.message };
  }
  if (!o) return { ok: false, error: "Pesanan tidak ditemukan." };
  if (o.status !== "pending_payment") return { ok: false, error: "Pesanan ini tidak sedang menunggu pembayaran." };

  const stillValid = o.payment_url && o.payment_expires_at && new Date(o.payment_expires_at).getTime() > Date.now() + 60_000;
  if (stillValid) return { ok: true, url: o.payment_url, expiresAt: o.payment_expires_at };

  const attempt = o.payment_attempts + 1;
  if (attempt > MAX_ATTEMPTS) return { ok: false, error: "Batas percobaan pembayaran tercapai. Hubungi kami." };

  try {
    const pay = await createCheckoutPayment({
      invoice: invoiceFor(o.order_code, attempt), amount: o.total,
      callbackUrl: `${siteUrl()}/orders?code=${o.order_code}`,
      dueMinutes: dueMinutes(), methods: paymentMethods(), itemName: `Pesanan ${o.order_code}`,
      customer: { name: o.customer_name, email: o.customer_email, phone: o.customer_phone },
    });
    // Optimistic lock: bila request lain sudah membuat tautan, pakai punya mereka
    const { data: updated } = await admin.from("orders").update({
      payment_provider: "doku", payment_url: pay.url, payment_expires_at: pay.expiresAt, payment_attempts: attempt,
    }).eq("id", o.id).eq("payment_attempts", o.payment_attempts).select("id");
    if (!updated || updated.length === 0) {
      const { data: again } = await admin.from("orders").select("payment_url, payment_expires_at").eq("id", o.id).maybeSingle();
      if (again?.payment_url) return { ok: true, url: again.payment_url, expiresAt: again.payment_expires_at };
      return { ok: false, error: "Gagal menyimpan tautan pembayaran." };
    }
    return { ok: true, url: pay.url, expiresAt: pay.expiresAt };
  } catch (e) {
    console.error("ensurePaymentLink:", e);
    const config = e instanceof DokuError && e.kind === "config";
    return {
      ok: false,
      error: config ? "Pembayaran belum dikonfigurasi." : "Gagal membuat tautan pembayaran DOKU. Silakan coba lagi.",
      // Detail teknis hanya di mode pengembangan agar tidak bocor ke pelanggan
      detail: process.env.NODE_ENV !== "production" && e instanceof Error ? e.message : undefined,
    };
  }
}

/** Terapkan hasil pembayaran lewat RPC idempoten (validasi nominal, restock saat batal). */
export async function applyPaymentResult(p: {
  eventId: string; invoice: string; status: "paid" | "expired"; amount: number; reference?: string | null; payload: unknown;
}): Promise<string> {
  const orderCode = orderCodeFromInvoice(p.invoice);
  if (!orderCode) return "unknown_invoice";
  const { data, error } = await createAdminClient().rpc("process_payment_event", {
    p_event_id: p.eventId, p_order_code: orderCode, p_reference: p.reference ?? null,
    p_status: p.status, p_amount: p.amount, p_payload: p.payload as Record<string, unknown>,
  });
  if (error) throw error;
  return data as string;
}

interface OrderRef { id: string; order_code: string; total: number; payment_attempts: number }

/** Cek ke DOKU semua invoice yang pernah dibuat untuk pesanan; jika ada yang SUCCESS, tandai lunas. */
export async function syncPaidFromDoku(o: OrderRef): Promise<"paid" | "not_paid" | "error"> {
  for (let attempt = 1; attempt <= Math.max(1, o.payment_attempts); attempt++) {
    const invoice = invoiceFor(o.order_code, attempt);
    try {
      const s = await getOrderStatus(invoice);
      if (s.status === "SUCCESS") {
        const result = await applyPaymentResult({
          eventId: `doku-status:${invoice}:SUCCESS`, invoice, status: "paid",
          amount: s.amount ?? o.total, reference: [s.channel, s.originalRequestId].filter(Boolean).join(":") || null,
          payload: { source: "check-status", ...s },
        });
        if (result === "paid" || result === "already_paid" || result === "duplicate") return "paid";
        console.warn(`[doku] status SUCCESS tetapi hasil ${result} untuk ${invoice}`);
        return "not_paid";
      }
    } catch (e) {
      console.error(`[doku] check status ${invoice}:`, e);
      return "error";
    }
  }
  return "not_paid";
}
