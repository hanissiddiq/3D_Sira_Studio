import type { Metadata } from "next";
import { ProductGrid } from "@/components/products/ProductGrid";
import { getProductList } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).catalog.shopTitle };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [products, t] = await Promise.all([getProductList({ ...{ kind: "ready" }, search: q }), getDict()]);
  return (
    <main className="mx-auto max-w-7xl p-4 md:p-8">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">{t.catalog.shopTitle}</h1>
      <p className="mb-6 text-muted-foreground">{t.landing.readySub}</p>
      <ProductGrid products={products} />
    </main>
  );
}
