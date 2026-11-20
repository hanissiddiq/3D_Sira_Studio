import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/products/ProductForm";
import { can } from "@/lib/permissions";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseCustomizerConfig, type ProductFormValues } from "@/lib/validations/product";

export const metadata: Metadata = { title: "Edit Produk" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("products:write");
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const { data: p, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("product detail:", error);
    return <p className="text-sm text-red-600">Gagal memuat produk.</p>;
  }
  if (!p) notFound();

  const defaults: ProductFormValues = {
    slug: p.slug, category: p.category, kind: p.kind === "ready" ? "ready" : "custom", name_id: p.name_id, name_en: p.name_en,
    description_id: p.description_id ?? "", description_en: p.description_en ?? "",
    base_price: p.base_price, text_fee: p.text_fee, logo_fee: p.logo_fee, weight_grams: p.weight_grams, stock: p.stock ?? null,
    is_active: p.is_active, model_url: p.model_url, images: p.images ?? [],
    customizer_config: parseCustomizerConfig(p.customizer_config),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit produk</h1>
      <ProductForm mode="edit" productId={p.id} defaultValues={defaults} canDelete={can(user.role, "products:delete")} />
    </div>
  );
}
