"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isProductAssetUrl, productAssetPath } from "@/lib/storage";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";

export type ProductActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; field?: "slug" };

function checkAssets(v: ProductFormValues): string | null {
  const urls = [v.model_url, ...v.images].filter((u): u is string => !!u);
  if (urls.some((u) => !isProductAssetUrl(u))) return "URL file tidak valid.";
  if (v.model_url && !v.model_url.toLowerCase().endsWith(".glb")) return "Model harus berformat .glb.";
  return null;
}

function toRow(v: ProductFormValues) {
  return {
    slug: v.slug, category: v.category,
    name_id: v.name_id, name_en: v.name_en,
    description_id: v.description_id || null, description_en: v.description_en || null,
    base_price: v.base_price, text_fee: v.text_fee, logo_fee: v.logo_fee, weight_grams: v.weight_grams,
    is_active: v.is_active, model_url: v.model_url, images: v.images,
    customizer_config: v.customizer_config,
  };
}

async function removeAssets(urls: (string | null | undefined)[]) {
  const paths = urls.map((u) => (u ? productAssetPath(u) : null)).filter((p): p is string => !!p);
  if (paths.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from("product-assets").remove(paths);
  if (error) console.error("asset cleanup failed:", error); // best-effort; tidak menggagalkan aksi
}

function revalidateAll(slug: string) {
  revalidatePath("/admin/products");
  revalidatePath("/product");
  revalidatePath(`/product/${slug}`);
}

export async function createProductAction(input: ProductFormValues): Promise<ProductActionResult> {
  await requirePermission("products:write");
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data produk tidak valid." };
  const assetError = checkAssets(parsed.data);
  if (assetError) return { ok: false, error: assetError };

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert(toRow(parsed.data)).select("id").single();
  if (error || !data) {
    if (error?.code === "23505") return { ok: false, error: "Slug sudah dipakai produk lain.", field: "slug" };
    console.error("createProduct:", error);
    return { ok: false, error: "Gagal menyimpan produk." };
  }
  revalidateAll(parsed.data.slug);
  return { ok: true, id: data.id };
}

export async function updateProductAction(id: string, input: ProductFormValues): Promise<ProductActionResult> {
  await requirePermission("products:write");
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data produk tidak valid." };
  const assetError = checkAssets(parsed.data);
  if (assetError) return { ok: false, error: assetError };

  const supabase = await createClient();
  const { data: old } = await supabase.from("products").select("slug, model_url, images").eq("id", id).maybeSingle();
  if (!old) return { ok: false, error: "Produk tidak ditemukan." };

  const { data, error } = await supabase.from("products").update(toRow(parsed.data)).eq("id", id).select("id").maybeSingle();
  if (error || !data) {
    if (error?.code === "23505") return { ok: false, error: "Slug sudah dipakai produk lain.", field: "slug" };
    console.error("updateProduct:", error);
    return { ok: false, error: "Gagal memperbarui produk." };
  }

  // Hapus file yang tidak lagi dipakai produk ini
  const keep = new Set([parsed.data.model_url, ...parsed.data.images]);
  await removeAssets([old.model_url, ...(old.images as string[])].filter((u) => !keep.has(u)));

  revalidateAll(old.slug);
  revalidateAll(parsed.data.slug);
  return { ok: true, id };
}

export async function deleteProductAction(id: string): Promise<ProductActionResult> {
  await requirePermission("products:delete");
  const supabase = await createClient();
  const { data: old } = await supabase.from("products").select("slug, model_url, images").eq("id", id).maybeSingle();
  if (!old) return { ok: false, error: "Produk tidak ditemukan." };

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return { ok: false, error: "Produk sudah dipakai pada pesanan dan tidak bisa dihapus. Nonaktifkan saja." };
    }
    console.error("deleteProduct:", error);
    return { ok: false, error: "Gagal menghapus produk." };
  }
  await removeAssets([old.model_url, ...(old.images as string[])]);
  revalidateAll(old.slug);
  return { ok: true, id };
}
