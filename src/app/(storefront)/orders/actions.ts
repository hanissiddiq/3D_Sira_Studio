"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupOrderSchema } from "@/lib/validations/order";
import { lookupOrder } from "@/services/orderService";

export async function lookupOrderAction(values: { orderCode: string; email: string }) {
  const parsed = lookupOrderSchema.safeParse(values);
  if (!parsed.success) return { ok: false as const, error: "Kode pesanan atau email tidak valid." };
  const order = await lookupOrder(parsed.data.orderCode, parsed.data.email);
  if (!order) return { ok: false as const, error: "Pesanan tidak ditemukan." };
  return { ok: true as const, order };
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

  // Kepemilikan dibuktikan dengan kode pesanan + email; ulasan hanya untuk pesanan selesai.
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
  }); // status default 'pending' -> menunggu moderasi
  if (error) {
    if (error.code === "23505") return { ok: false as const, error: "Anda sudah mengulas item ini." };
    console.error("submitReview:", error);
    return { ok: false as const, error: "Gagal mengirim ulasan." };
  }
  return { ok: true as const };
}
