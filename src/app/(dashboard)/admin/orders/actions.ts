"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES } from "@/lib/order-status";

const schema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES),
  trackingNumber: z.string().trim().max(100).optional(),
  note: z.string().trim().max(500).optional(),
});

const ERRORS: Record<string, string> = {
  order_not_found: "Pesanan tidak ditemukan.",
  invalid_transition: "Perubahan status tidak diizinkan dari status saat ini.",
  admin_only_cancel: "Hanya admin yang dapat membatalkan pesanan yang sudah dibayar.",
  tracking_required: "Nomor resi wajib diisi sebelum status Dikirim.",
};

export async function updateOrderStatusAction(input: z.input<typeof schema>) {
  await requirePermission("orders:update"); // otorisasi ulang di setiap action
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Data tidak valid." };

  const supabase = await createClient(); // session staff -> RLS + is_admin() berlaku
  const { error } = await supabase.rpc("update_order_status", {
    p_order_id: parsed.data.orderId,
    p_status: parsed.data.status,
    p_tracking: parsed.data.trackingNumber || null,
    p_note: parsed.data.note || null,
  });

  if (error) {
    const known = Object.keys(ERRORS).find((k) => error.message.includes(k));
    if (!known) console.error("update_order_status:", error);
    return { ok: false as const, error: known ? ERRORS[known] : "Gagal memperbarui status." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return { ok: true as const };
}
