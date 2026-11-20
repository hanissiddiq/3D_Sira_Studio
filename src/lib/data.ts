import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tier } from "@/lib/pricing";

export const getBulkTiers = cache(async (): Promise<Tier[]> => {
  const { data, error } = await createPublicClient()
    .from("bulk_discount_tiers").select("min_quantity, percent").order("min_quantity");
  if (error) { console.error("bulk tiers:", error); return []; }
  return data.map((t) => ({ min_quantity: t.min_quantity, percent: Number(t.percent) }));
});

export type ProductKind = "custom" | "ready";

export async function getProductList(filter: { kind?: ProductKind; category?: string; search?: string; limit?: number }) {
  let q = createPublicClient()
    .from("products")
    .select("slug, kind, category, name_id, name_en, description_id, description_en, base_price, stock, images")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (filter.kind) q = q.eq("kind", filter.kind);
  if (filter.category) q = q.eq("category", filter.category);
  // buang karakter yang bermakna di sintaks filter PostgREST
  const term = (filter.search ?? "").replace(/[^\w\s.\-]/g, "").trim().slice(0, 50);
  if (term) q = q.or(`name_id.ilike.%${term}%,name_en.ilike.%${term}%`);
  if (filter.limit) q = q.limit(filter.limit);
  const { data, error } = await q;
  if (error) { console.error("product list:", error); return null; }
  return data;
}

export async function getApprovedReviews(productId: string) {
  const { data, error } = await createPublicClient()
    .from("reviews")
    .select("id, reviewer_name, rating, comment, created_at")
    .eq("product_id", productId).eq("status", "approved")
    .order("created_at", { ascending: false }).limit(20);
  if (error) { console.error("reviews:", error); return []; }
  return data;
}

export async function getGalleryItems() {
  const { data, error } = await createPublicClient()
    .from("gallery_items")
    .select("id, title, image_url, category, products ( slug, kind, is_active )")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) { console.error("gallery:", error); return null; }
  return data;
}

export async function getFleetSummary() {
  const { data, error } = await createPublicClient().rpc("fleet_summary");
  if (error || !data) return null;
  const f = data as { total: number; online: number; active: number };
  return f.total > 0 ? f : null;
}

export async function getReviewStats() {
  const { data, error } = await createPublicClient().from("reviews").select("rating").eq("status", "approved").limit(5000);
  if (error || !data || data.length === 0) return null;
  const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
  return { avg, count: data.length };
}

export async function getLatestReviews(limit = 3) {
  const { data, error } = await createPublicClient()
    .from("reviews")
    .select("id, reviewer_name, rating, comment, products ( name_id, name_en )")
    .eq("status", "approved").not("comment", "is", null)
    .order("created_at", { ascending: false }).limit(limit);
  if (error) { console.error("latest reviews:", error); return []; }
  return data;
}
