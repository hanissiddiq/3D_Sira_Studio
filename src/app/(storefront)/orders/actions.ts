"use server";

import { lookupOrderSchema } from "@/lib/validations/order";
import { lookupOrder } from "@/services/orderService";

export async function lookupOrderAction(values: { orderCode: string; email: string }) {
  const parsed = lookupOrderSchema.safeParse(values);
  if (!parsed.success) return { ok: false as const, error: "Kode pesanan atau email tidak valid." };
  const order = await lookupOrder(parsed.data.orderCode, parsed.data.email);
  if (!order) return { ok: false as const, error: "Pesanan tidak ditemukan." };
  return { ok: true as const, order };
}
