import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyPaymentResult, invoiceFor, syncPaidFromDoku } from "@/services/paymentService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GRACE_MS = 5 * 60_000;            // beri waktu notifikasi/pembayaran terlambat
const NEVER_PAID_AFTER_MS = 2 * 3600_000; // pesanan tanpa tautan pembayaran
const BATCH = 25;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const a = Buffer.from(request.headers.get("authorization") ?? ""), b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Membatalkan pesanan pending_payment yang kedaluwarsa (stok produk siap beli dikembalikan).
 * Sebelum membatalkan, status DOKU dicek: jika ternyata SUCCESS, pesanan ditandai lunas.
 * Jadwalkan tiap ~15 menit dengan header `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(request: Request) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ ok: false, error: "CRON_SECRET belum diatur" }, { status: 503 });
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });

  const admin = createAdminClient();
  const now = Date.now();
  const { data: orders, error } = await admin.from("orders")
    .select("id, order_code, total, payment_attempts")
    .eq("status", "pending_payment")
    .or(`payment_expires_at.lt.${new Date(now - GRACE_MS).toISOString()},and(payment_expires_at.is.null,created_at.lt.${new Date(now - NEVER_PAID_AFTER_MS).toISOString()})`)
    .order("created_at", { ascending: true }).limit(BATCH);
  if (error) { console.error("[cron] query:", error); return NextResponse.json({ ok: false }, { status: 500 }); }

  const summary = { checked: orders.length, paid: 0, expired: 0, skipped: 0 };
  for (const o of orders) {
    if (o.payment_attempts > 0) {
      const state = await syncPaidFromDoku(o);
      if (state === "paid") { summary.paid++; continue; }
      if (state === "error") { summary.skipped++; continue; } // coba lagi di putaran berikut; jangan batalkan saat ragu
    }
    try {
      await applyPaymentResult({
        eventId: `cron-expire:${o.order_code}:${o.payment_attempts}`, invoice: invoiceFor(o.order_code, 1),
        status: "expired", amount: o.total, payload: { source: "cron-expire" },
      });
      summary.expired++;
    } catch (e) {
      console.error("[cron] expire:", o.order_code, e);
      summary.skipped++;
    }
  }
  return NextResponse.json({ ok: true, ...summary });
}

export const GET = handle;
export const POST = handle;
