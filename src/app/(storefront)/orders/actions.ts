"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupOrderSchema } from "@/lib/validations/order";
import { lookupOrder } from "@/services/orderService";
import { checkoutPresentation, dbErrorMessage, ensurePaymentLink, syncPaidFromDoku } from "@/services/paymentService";

export async function lookupOrderAction(values: { orderCode: string; email: string }) {
  const parsed = lookupOrderSchema.safeParse(values);
  if (!parsed.success) return { ok: false as const, error: "Kode pesanan atau email tidak valid." };
  const order = await lookupOrder(parsed.data.orderCode, parsed.data.email);
  if (!order) return { ok: false as const, error: "Pesanan tidak ditemukan." };
  return { ok: true as const, order };
}

// Kepemilikan pesanan dibuktikan dengan kode + email (sama seperti lookup)
type OwnedOrder = { id: string; order_code: string; total: number; status: string; payment_attempts: number; payment_checked_at: string | null };
type Owned = { ok: true; order: OwnedOrder } | { ok: false; error: string };

async function findOwnedOrder(values: { orderCode: string; email: string }): Promise<Owned> {
  const parsed = lookupOrderSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Kode pesanan atau email tidak valid." };
  const { data, error } = await createAdminClient().from("orders")
    .select("id, order_code, total, status, payment_attempts, payment_checked_at")
    .eq("order_code", parsed.data.orderCode).eq("customer_email", parsed.data.email).maybeSingle();
  if (error) {
    console.error("findOwnedOrder:", error);
    return { ok: false, error: dbErrorMessage(error) };
  }
  return data ? { ok: true, order: data as OwnedOrder } : { ok: false, error: "Pesanan tidak ditemukan." };
}

/** Tombol "Bayar sekarang": tautan DOKU aktif (dibuat ulang bila sudah kedaluwarsa). */
export async function getPaymentLinkAction(values: { orderCode: string; email: string }) {
  const found = await findOwnedOrder(values);
  if (!found.ok) return { ok: false as const, error: found.error };
  const link = await ensurePaymentLink(found.order.order_code);
  return link.ok
    ? { ok: true as const, payment: { url: link.url, ...checkoutPresentation() } }
    : { ok: false as const, error: [link.error, link.detail].filter(Boolean).join(" — ") };
}

const MIN_CHECK_INTERVAL_MS = 30_000;

/** Tombol "Saya sudah bayar": cek langsung ke DOKU (cadangan jika notifikasi terlambat). */
export async function syncPaymentStatusAction(values: { orderCode: string; email: string }) {
  const found = await findOwnedOrder(values);
  if (!found.ok) return { ok: false as const, error: found.error };
  const order = found.order;
  if (order.status !== "pending_payment") return { ok: true as const, paid: order.status !== "cancelled" };
  if (order.payment_attempts === 0) return { ok: true as const, paid: false };

  const last = order.payment_checked_at ? new Date(order.payment_checked_at).getTime() : 0;
  if (Date.now() - last < MIN_CHECK_INTERVAL_MS) return { ok: false as const, error: "Tunggu beberapa detik sebelum mengecek lagi." };
  await createAdminClient().from("orders").update({ payment_checked_at: new Date().toISOString() }).eq("id", order.id);

  const state = await syncPaidFromDoku(order);
  if (state === "error") return { ok: false as const, error: "Gagal menghubungi DOKU. Coba lagi sebentar lagi." };
  return { ok: true as const, paid: state === "paid" };
}

const reviewSchema = lookupOrderSchema.extend({
  orderItemId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000),
});

// "Budi Santoso" -> "Budi S." (nama lengkap pelanggan tidak ditampilkan publik)
function maskName(full: string) {
  const [first, second] = full.trim().split(/\s+/);
  return second ? `${first} ${second[0].toUpperCase()}.` : first;
}

export async function submitReviewAction(input: z.input<typeof reviewSchema>) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Data ulasan tidak valid." };
  const v = parsed.data;

  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id, status, customer_name")
    .eq("order_code", v.orderCode).eq("customer_email", v.email).maybeSingle();
  if (!order) return { ok: false as const, error: "Pesanan tidak ditemukan." };
  if (order.status !== "completed") return { ok: false as const, error: "Ulasan hanya dapat dikirim untuk pesanan yang sudah selesai." };

  const { data: item } = await admin.from("order_items").select("id, product_id")
    .eq("id", v.orderItemId).eq("order_id", order.id).maybeSingle();
  if (!item) return { ok: false as const, error: "Item pesanan tidak ditemukan." };

  const { error } = await admin.from("reviews").insert({
    order_item_id: item.id, product_id: item.product_id,
    reviewer_name: maskName(order.customer_name), rating: v.rating, comment: v.comment || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false as const, error: "Anda sudah mengulas item ini." };
    console.error("submitReview:", error);
    return { ok: false as const, error: "Gagal mengirim ulasan." };
  }
  return { ok: true as const };
}
