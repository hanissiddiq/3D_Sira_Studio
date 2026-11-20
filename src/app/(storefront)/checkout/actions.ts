"use server";

import { createOrderSchema, type CreateOrderInput } from "@/lib/validations/order";
import { createOrder, OrderError } from "@/services/orderService";

export type CheckoutResult =
  | { ok: true; orderCode: string; total: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function checkoutAction(input: CreateOrderInput): Promise<CheckoutResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Data pesanan tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const order = await createOrder(parsed.data);
    return { ok: true, orderCode: order.orderCode, total: order.total };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    console.error("checkoutAction:", e);
    return { ok: false, error: "Terjadi kesalahan server." };
  }
}
