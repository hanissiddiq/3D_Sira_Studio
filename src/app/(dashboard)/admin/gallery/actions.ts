"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isProductAssetUrl, productAssetPath } from "@/lib/storage";

const baseSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(120),
  productId: z.string().uuid().nullable(),
  category: z.string().trim().max(40).nullable(),
  isPublished: z.boolean(),
  sortOrder: z.number().int().min(0).max(100000),
});
const createSchema = baseSchema.extend({ imageUrl: z.string().url() });

export type GalleryResult = { ok: true } | { ok: false; error: string };

function revalidateGallery() {
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function createGalleryItemAction(input: z.input<typeof createSchema>): Promise<GalleryResult> {
  await requirePermission("gallery:write");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const v = parsed.data;
  // Hanya file yang diunggah ke folder gallery/ bucket proyek ini
  if (!isProductAssetUrl(v.imageUrl) || !productAssetPath(v.imageUrl)?.startsWith("gallery/")) {
    return { ok: false, error: "URL gambar tidak valid." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_items").insert({
    title: v.title, image_url: v.imageUrl, product_id: v.productId, category: v.category || null,
    is_published: v.isPublished, sort_order: v.sortOrder,
  });
  if (error) { console.error("createGalleryItem:", error); return { ok: false, error: "Gagal menyimpan item." }; }
  revalidateGallery();
  return { ok: true };
}

export async function updateGalleryItemAction(id: string, input: z.input<typeof baseSchema>): Promise<GalleryResult> {
  await requirePermission("gallery:write");
  const parsed = baseSchema.safeParse(input);
  if (!parsed.success || !z.string().uuid().safeParse(id).success) {
    return { ok: false, error: parsed.success ? "ID tidak valid." : (parsed.error.issues[0]?.message ?? "Data tidak valid.") };
  }
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.from("gallery_items").update({
    title: v.title, product_id: v.productId, category: v.category || null, is_published: v.isPublished, sort_order: v.sortOrder,
  }).eq("id", id).select("id").maybeSingle();
  if (error || !data) { console.error("updateGalleryItem:", error); return { ok: false, error: "Gagal memperbarui item." }; }
  revalidateGallery();
  return { ok: true };
}

export async function deleteGalleryItemAction(id: string): Promise<GalleryResult> {
  await requirePermission("gallery:write");
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "ID tidak valid." };
  const supabase = await createClient();
  const { data: row } = await supabase.from("gallery_items").select("image_url").eq("id", id).maybeSingle();
  if (!row) return { ok: false, error: "Item tidak ditemukan." };

  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) { console.error("deleteGalleryItem:", error); return { ok: false, error: "Gagal menghapus item." }; }

  const path = productAssetPath(row.image_url);
  if (path) {
    const { error: rmErr } = await supabase.storage.from("product-assets").remove([path]);
    if (rmErr) console.error("gallery asset cleanup failed:", rmErr); // best-effort
  }
  revalidateGallery();
  return { ok: true };
}
