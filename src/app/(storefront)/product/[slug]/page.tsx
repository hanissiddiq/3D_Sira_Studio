import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCustomizer } from "@/components/customizer/ProductCustomizer";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { createClient } from "@/lib/supabase/server";
import { pick } from "@/lib/i18n/dictionaries";
import { getLang } from "@/lib/i18n/server";
import { parseCustomizerConfig } from "@/lib/validations/product";

const getProduct = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*")
    .eq("slug", slug).eq("kind", "custom").eq("is_active", true).maybeSingle();
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

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, lang] = await Promise.all([getProduct(slug), getLang()]);
  if (!p) notFound();
  const name = pick(lang, p.name_id, p.name_en);
  const description = pick(lang, p.description_id, p.description_en);

  return (
    <main className="mx-auto max-w-6xl space-y-10 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-semibold">{name}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      <ProductCustomizer
        productId={p.id} slug={p.slug} name={name} modelUrl={p.model_url}
        config={parseCustomizerConfig(p.customizer_config)}
        basePrice={p.base_price} textFee={p.text_fee} logoFee={p.logo_fee}
      />
      <ProductReviews productId={p.id} />
    </main>
  );
}
