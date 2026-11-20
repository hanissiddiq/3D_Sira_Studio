"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: true } | { ok: false; error: string };
const schema = z.object({
  minQuantity: z.number().int().min(2, "Minimal 2 pcs").max(100000),
  percent: z.number().gt(0, "Persen harus > 0").lte(100),
});

function refresh() { revalidatePath("/admin/settings"); revalidatePath("/", "layout"); }

export async function saveTierAction(tierId: string | null, input: z.input<typeof schema>): Promise<Result> {
  await requirePermission("discounts:manage");
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid." };
  const supabase = await createClient();
  const row = { min_quantity: p.data.minQuantity, percent: p.data.percent };
  const { error } = tierId
    ? await supabase.from("bulk_discount_tiers").update(row).eq("id", tierId)
    : await supabase.from("bulk_discount_tiers").insert(row);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Sudah ada tier dengan jumlah minimal tersebut." };
    console.error("saveTier:", error);
    return { ok: false, error: "Gagal menyimpan tier." };
  }
  refresh(); return { ok: true };
}

export async function deleteTierAction(tierId: string): Promise<Result> {
  await requirePermission("discounts:manage");
  if (!z.string().uuid().safeParse(tierId).success) return { ok: false, error: "ID tidak valid." };
  const { error } = await (await createClient()).from("bulk_discount_tiers").delete().eq("id", tierId);
  if (error) { console.error("deleteTier:", error); return { ok: false, error: "Gagal menghapus tier." }; }
  refresh(); return { ok: true };
}
