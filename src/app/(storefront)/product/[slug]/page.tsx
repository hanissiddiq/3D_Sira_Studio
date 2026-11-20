import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCustomizer } from "@/components/customizer/ProductCustomizer";
import { createClient } from "@/lib/supabase/server";
import { parseCustomizerConfig } from "@/lib/validations/product";

const getProduct = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  return data;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return { title: p?.name_id ?? "Produk", description: p?.description_id ?? undefined };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-semibold">{p.name_id}</h1>
        {p.description_id && <p className="mt-2 max-w-2xl text-muted-foreground">{p.description_id}</p>}
      </div>
      <ProductCustomizer
        productId={p.id} slug={p.slug}
        name={p.name_id} modelUrl={p.model_url}
        config={parseCustomizerConfig(p.customizer_config)}
        basePrice={p.base_price} textFee={p.text_fee} logoFee={p.logo_fee}
      />
    </main>
  );
}
