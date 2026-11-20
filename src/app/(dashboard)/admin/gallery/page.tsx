import type { Metadata } from "next";
import { GalleryManager } from "@/components/gallery/GalleryManager";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Galeri" };

export default async function AdminGalleryPage() {
  await requirePermission("gallery:write");
  const supabase = await createClient();
  const [items, products] = await Promise.all([
    supabase.from("gallery_items").select("id, title, image_url, product_id, category, is_published, sort_order")
      .order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    supabase.from("products").select("id, name_id").order("name_id"),
  ]);
  if (items.error || products.error) {
    console.error("admin gallery:", items.error ?? products.error);
    return <p className="text-sm text-red-600">Gagal memuat galeri.</p>;
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Galeri</h1>
      <GalleryManager items={items.data} products={products.data} />
    </div>
  );
}
