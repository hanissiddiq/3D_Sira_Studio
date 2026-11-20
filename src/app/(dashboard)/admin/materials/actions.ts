"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: true } | { ok: false; error: string };

const schema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(80),
  type: z.string().trim().min(1).max(30),
  colorName: z.string().trim().max(40),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna tidak valid"),
  stockRolls: z.number().min(0).max(100000),
  gramsPerRoll: z.number().int().min(1).max(10000),
  lowStockRolls: z.number().min(0).max(100000),
  costPerKg: z.number().int().min(0).max(100_000_000),
});
const id = z.string().uuid();

const toRow = (v: z.infer<typeof schema>) => ({
  name: v.name, type: v.type, color_name: v.colorName, color_hex: v.colorHex,
  stock_rolls: v.stockRolls, grams_per_roll: v.gramsPerRoll, low_stock_rolls: v.lowStockRolls, cost_per_kg: v.costPerKg,
});
function refresh() { revalidatePath("/admin/materials"); revalidatePath("/admin"); revalidatePath("/admin/slicing"); }

export async function createMaterialAction(input: z.input<typeof schema>): Promise<Result> {
  await requirePermission("workshop:manage");
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid." };
  const { error } = await (await createClient()).from("materials").insert(toRow(p.data));
  if (error) { console.error("createMaterial:", error); return { ok: false, error: "Gagal menyimpan material." }; }
  refresh(); return { ok: true };
}

export async function updateMaterialAction(materialId: string, input: z.input<typeof schema>): Promise<Result> {
  await requirePermission("workshop:manage");
  const p = schema.safeParse(input);
  if (!p.success || !id.safeParse(materialId).success) return { ok: false, error: p.success ? "ID tidak valid." : (p.error.issues[0]?.message ?? "Data tidak valid.") };
  const { data, error } = await (await createClient()).from("materials").update(toRow(p.data)).eq("id", materialId).select("id").maybeSingle();
  if (error || !data) { console.error("updateMaterial:", error); return { ok: false, error: "Gagal memperbarui material." }; }
  refresh(); return { ok: true };
}

export async function deleteMaterialAction(materialId: string): Promise<Result> {
  await requirePermission("orders:delete"); // khusus admin
  if (!id.safeParse(materialId).success) return { ok: false, error: "ID tidak valid." };
  const { error } = await (await createClient()).from("materials").delete().eq("id", materialId);
  if (error) { console.error("deleteMaterial:", error); return { ok: false, error: "Gagal menghapus material." }; }
  refresh(); return { ok: true };
}
