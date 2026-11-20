"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: true } | { ok: false; error: string };

const schema = z.object({
  orderId: z.string().uuid(),
  printerId: z.string().uuid(),
  materialId: z.string().uuid().nullable(),
  layerHeight: z.number().min(0.04).max(0.4),
  infill: z.number().int().min(0).max(100),
  estMinutes: z.number().int().min(1).max(100000),
  estGrams: z.number().int().min(1).max(100000),
  notes: z.string().trim().max(500),
  // Semua item pra-cetak wajib dicentang operator
  preflight: z.object({ dimensions: z.literal(true), design: z.literal(true), color: z.literal(true), support: z.literal(true) }),
});

const ERRORS: Record<string, string> = {
  order_not_found: "Pesanan tidak ditemukan.",
  invalid_transition: "Pesanan sudah tidak berstatus menunggu validasi.",
  printer_not_found: "Printer tidak ditemukan.",
  printer_busy: "Printer sedang tidak idle. Pilih printer lain.",
  material_not_found: "Material tidak ditemukan.",
};

export async function startPrintJobAction(input: z.input<typeof schema>): Promise<Result> {
  await requirePermission("workshop:manage");
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: "Lengkapi semua data dan centang seluruh checklist pra-cetak." };
  const v = p.data;

  const { error } = await (await createClient()).rpc("start_print_job", {
    p_order_id: v.orderId, p_printer_id: v.printerId, p_material_id: v.materialId,
    p_layer_height: v.layerHeight, p_infill: v.infill, p_est_minutes: v.estMinutes, p_est_grams: v.estGrams,
    p_notes: v.notes || null, p_preflight: v.preflight,
  });
  if (error) {
    const known = Object.keys(ERRORS).find((k) => error.message.includes(k));
    if (!known) console.error("start_print_job:", error);
    return { ok: false, error: known ? ERRORS[known] : "Gagal memulai pekerjaan cetak." };
  }
  for (const path of ["/admin", "/admin/slicing", "/admin/fleet", "/admin/materials", "/admin/orders"]) revalidatePath(path);
  return { ok: true };
}
