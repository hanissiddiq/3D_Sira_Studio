import { getLang } from "@/lib/i18n/server";
import { dictionaries, pick } from "@/lib/i18n/dictionaries";
import { ProductCard } from "./ProductCard";

export interface ProductRow {
  slug: string; kind: string; category: string; name_id: string; name_en: string;
  description_id: string | null; description_en: string | null; base_price: number;
  stock: number | null; images: string[] | null;
}

export async function ProductGrid({ products, columns = "lg:grid-cols-3" }: { products: ProductRow[] | null; columns?: string }) {
  const lang = await getLang();
  const t = dictionaries[lang];
  if (products === null) return <p className="text-sm text-red-600">{t.catalog.loadError}</p>;
  if (products.length === 0) return <p className="text-muted-foreground">{t.catalog.empty}</p>;
  return (
    <div className={`grid gap-6 sm:grid-cols-2 ${columns}`}>
      {products.map((p) => {
        const ready = p.kind === "ready";
        const soldOut = ready && p.stock !== null && p.stock <= 0;
        return (
          <ProductCard key={p.slug} variant={ready ? "ready" : "custom"}
            href={`${ready ? "/shop" : "/product"}/${p.slug}`}
            name={pick(lang, p.name_id, p.name_en)} description={pick(lang, p.description_id, p.description_en)}
            price={p.base_price} image={p.images?.[0]} badge={p.category} fromLabel={t.landing.catFrom}
            cta={ready ? t.landing.readyBuy : t.landing.catOpen}
            stockLabel={ready && p.stock !== null ? t.landing.readyStock(p.stock) : undefined}
            soldOut={soldOut} soldOutLabel={t.landing.readySoldOut} />
        );
      })}
    </div>
  );
}
