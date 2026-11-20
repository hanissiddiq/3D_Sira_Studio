"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: true } | { ok: false; error: string };
const id = z.string().uuid();

const createSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(40),
  model: z.string().trim().max(80),
  nozzle: z.string().trim().min(1).max(20),
});

function refresh() { revalidatePath("/admin/fleet"); revalidatePath("/admin"); revalidatePath("/admin/slicing"); }

export async function createPrinterAction(input: z.input<typeof createSchema>): Promise<Result> {
  await requirePermission("workshop:manage");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.from("printers").insert(parsed.data);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Nama printer sudah dipakai." };
    console.error("createPrinter:", error);
    return { ok: false, error: "Gagal menambah printer." };
  }
  refresh();
  return { ok: true };
}

// idle / maintenance / offline. 'printing' hanya lewat Slicing & Validasi.
export async function setPrinterStatusAction(printerId: string, status: "idle" | "maintenance" | "offline"): Promise<Result> {
  await requirePermission("workshop:manage");
  if (!id.safeParse(printerId).success || !["idle", "maintenance", "offline"].includes(status)) return { ok: false, error: "Data tidak valid." };
  const supabase = await createClient();
  const { data: p } = await supabase.from("printers").select("status").eq("id", printerId).maybeSingle();
  if (!p) return { ok: false, error: "Printer tidak ditemukan." };
  if (p.status === "printing") return { ok: false, error: "Printer sedang mencetak. Selesaikan pekerjaannya di papan antrean dulu." };
  const { error } = await supabase.from("printers")
    .update({ status, current_order_id: null, current_label: null }).eq("id", printerId);
  if (error) { console.error("setPrinterStatus:", error); return { ok: false, error: "Gagal memperbarui printer." }; }
  refresh();
  return { ok: true };
}

export async function deletePrinterAction(printerId: string): Promise<Result> {
  await requirePermission("orders:delete"); // khusus admin (RLS juga membatasi)
  if (!id.safeParse(printerId).success) return { ok: false, error: "Data tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.from("printers").delete().eq("id", printerId);
  if (error) { console.error("deletePrinter:", error); return { ok: false, error: "Gagal menghapus printer." }; }
  refresh();
  return { ok: true };
}
