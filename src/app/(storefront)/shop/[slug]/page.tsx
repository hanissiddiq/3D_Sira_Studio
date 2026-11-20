import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopProductView } from "@/components/products/ShopProductView";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { createPublicClient } from "@/lib/supabase/public";
import { pick } from "@/lib/i18n/dictionaries";
import { getLang } from "@/lib/i18n/server";

const getProduct = cache(async (slug: string) => {
  const { data } = await createPublicClient().from("products").select("*")
    .eq("slug", slug).eq("kind", "ready").eq("is_active", true).maybeSingle();
  return data;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [p, lang] = await Promise.all([getProduct(slug), getLang()]);
  return {
    title: p ? pick(lang, p.name_id, p.name_en) : "Product",
    description: p ? pick(lang, p.description_id, p.description_en) || undefined : undefined,
  };
}

export default async function ShopProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, lang] = await Promise.all([getProduct(slug), getLang()]);
  if (!p) notFound();
  return (
    <main className="mx-auto max-w-6xl space-y-10 p-4 md:p-8">
      <ShopProductView
        productId={p.id} slug={p.slug}
        name={pick(lang, p.name_id, p.name_en)} description={pick(lang, p.description_id, p.description_en)}
        images={p.images ?? []} modelUrl={p.model_url} basePrice={p.base_price} stock={p.stock ?? null}
      />
      <ProductReviews productId={p.id} />
    </main>
  );
}
