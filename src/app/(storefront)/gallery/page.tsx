import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { toGalleryEntries } from "@/lib/gallery";
import { getGalleryItems } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).gallery.title };
}

export default async function GalleryPage() {
  const [rows, t] = await Promise.all([getGalleryItems(), getDict()]);
  const items = toGalleryEntries(rows ?? []);
  return (
    <main className="mx-auto max-w-7xl p-4 md:p-8">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">{t.landing.galTitle}</h1>
      <p className="mb-6 text-muted-foreground">{t.landing.galSub}</p>
      {rows === null ? <p className="text-sm text-red-600">{t.catalog.loadError}</p>
        : items.length === 0 ? <p className="text-muted-foreground">{t.gallery.empty}</p>
        : <GalleryGrid items={items} />}
    </main>
  );
}
