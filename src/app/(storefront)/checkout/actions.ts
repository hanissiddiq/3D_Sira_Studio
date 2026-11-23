"use server";

import { createOrderSchema, type CreateOrderInput } from "@/lib/validations/order";
import { createOrder, OrderError } from "@/services/orderService";
import { checkoutPresentation, ensurePaymentLink } from "@/services/paymentService";

export type PaymentInfo = { url: string; mode: "popup" | "redirect"; sdkUrl: string | null };
export type CheckoutResult =
  | { ok: true; orderCode: string; total: number; payment: PaymentInfo | null; paymentError?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function checkoutAction(input: CreateOrderInput): Promise<CheckoutResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Data pesanan tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const order = await createOrder(parsed.data);
    // Pesanan sudah tersimpan; bila DOKU gagal, pelanggan bisa menekan "Bayar sekarang" di Lacak Pesanan.
    const link = await ensurePaymentLink(order.orderCode);
    return {
      ok: true, orderCode: order.orderCode, total: order.total,
      payment: link.ok ? { url: link.url, ...checkoutPresentation() } : null,
      paymentError: link.ok ? undefined : [link.error, link.detail].filter(Boolean).join(" — "),
    };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    console.error("checkoutAction:", e);
    return { ok: false, error: "Terjadi kesalahan server." };
  }
}
