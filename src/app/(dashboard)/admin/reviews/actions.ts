"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const statusSchema = z.enum(["pending", "approved", "rejected"]);
export type ReviewResult = { ok: true } | { ok: false; error: string };

function revalidateReviews() {
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/product", "layout");
  revalidatePath("/shop", "layout");
}

export async function moderateReviewAction(id: string, status: "pending" | "approved" | "rejected"): Promise<ReviewResult> {
  await requirePermission("reviews:moderate");
  if (!idSchema.safeParse(id).success || !statusSchema.safeParse(status).success) return { ok: false, error: "Data tidak valid." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").update({ status }).eq("id", id).select("id").maybeSingle();
  if (error || !data) { console.error("moderateReview:", error); return { ok: false, error: "Gagal memperbarui ulasan." }; }
  revalidateReviews();
  return { ok: true };
}

export async function deleteReviewAction(id: string): Promise<ReviewResult> {
  await requirePermission("reviews:delete"); // RLS juga hanya mengizinkan admin
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Data tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) { console.error("deleteReview:", error); return { ok: false, error: "Gagal menghapus ulasan." }; }
  revalidateReviews();
  return { ok: true };
}
