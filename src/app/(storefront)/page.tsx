import Link from "next/link";
import { FlowSteps } from "@/components/landing/FlowSteps";
import { Hero } from "@/components/landing/Hero";
import { SectionHead } from "@/components/landing/SectionHead";
import { Testimonials } from "@/components/landing/Testimonials";
import { TierSimulator } from "@/components/landing/TierSimulator";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { ProductGrid } from "@/components/products/ProductGrid";
import { getBulkTiers, getGalleryItems, getLatestReviews, getProductList, getReviewStats } from "@/lib/data";
import { toGalleryEntries } from "@/lib/gallery";
import { getDict, getLang } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/dictionaries";

export default async function HomePage() {
  const [t, lang, tiers, custom, ready, gallery, reviews, stats] = await Promise.all([
    getDict(), getLang(), getBulkTiers(),
    getProductList({ kind: "custom", limit: 6 }), getProductList({ kind: "ready", limit: 4 }),
    getGalleryItems(), getLatestReviews(3), getReviewStats(),
  ]);
  const l = t.landing;
  const hero = custom?.[0];
  const galleryItems = toGalleryEntries(gallery ?? []).slice(0, 8);

  return (
    <main>
      <Hero stats={stats}
        demo={{ href: hero ? `/product/${hero.slug}` : "/product", basePrice: hero?.base_price ?? 35000, textFee: 0 }} />
      <FlowSteps />

      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHead eyebrow={`🎨 ${l.catEyebrow}`} title={l.catTitle} sub={l.catSub} href="/product" linkLabel={l.catAll} />
        <ProductGrid products={custom} />
      </section>

      {ready && ready.length > 0 && (
        <section className="border-y-2 border-ink/15 bg-card/60">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-peach text-xl shadow-cartoon">⚡</span>
                <div>
                  <h2 className="flex flex-wrap items-center gap-2 text-xl font-extrabold">{l.readyTitle}
                    <span className="rounded-full border-2 border-ink bg-peach px-2 py-0.5 font-label text-[10px] font-bold text-on-pastel">{l.readyBadge} 🚀</span></h2>
                  <p className="text-sm text-muted-foreground">{l.readySub}</p>
                </div>
              </div>
              <Link href="/shop" className="font-label text-sm font-bold text-primary hover:underline">{l.readyAll} ›</Link>
            </div>
            <ProductGrid products={ready} columns="lg:grid-cols-4" />
          </div>
        </section>
      )}

      {galleryItems.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <SectionHead eyebrow={`📷 ${l.galEyebrow}`} title={l.galTitle} sub={l.galSub} href="/gallery" linkLabel={t.nav.realPrint} />
          <GalleryGrid items={galleryItems} />
        </section>
      )}

      <Testimonials reviews={reviews} stats={stats} />

      {tiers.length > 0 && (
        <TierSimulator tiers={tiers} basePrice={hero?.base_price ?? 29000}
          productName={hero ? pick(lang, hero.name_id, hero.name_en) : "—"}
          whatsapp={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || undefined} />
      )}
    </main>
  );
}
