"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: true } | { ok: false; error: string };

const schema = z.object({
  orderId: z.string().uuid(),
  tracking: z.string().trim().min(3, "Nomor resi minimal 3 karakter").max(60).regex(/^[\w\-./]+$/, "Resi hanya huruf, angka, - . /"),
  weightGrams: z.number("Berat wajib diisi").int().min(1, "Berat minimal 1 gram").max(1_000_000),
  box: z.string().trim().max(40),
});

const ERRORS: Record<string, string> = {
  invalid_transition: "Pesanan tidak berstatus Packing & Kurir.",
  tracking_required: "Nomor resi wajib diisi.",
  order_not_found: "Pesanan tidak ditemukan.",
};

export async function dispatchOrderAction(input: z.input<typeof schema>): Promise<Result> {
  await requirePermission("workshop:manage");
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid." };
  const { error } = await (await createClient()).rpc("dispatch_order", {
    p_order_id: p.data.orderId, p_tracking: p.data.tracking, p_weight: p.data.weightGrams, p_box: p.data.box || null,
  });
  if (error) {
    const known = Object.keys(ERRORS).find((k) => error.message.includes(k));
    if (!known) console.error("dispatch_order:", error);
    return { ok: false, error: known ? ERRORS[known] : "Gagal menandai pesanan dikirim." };
  }
  for (const path of ["/admin", "/admin/logistics", "/admin/orders"]) revalidatePath(path);
  return { ok: true };
}
