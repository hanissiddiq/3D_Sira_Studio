import type { GalleryEntry } from "@/components/gallery/GalleryGrid";

interface Row {
  id: string; title: string; image_url: string; category: string | null; products: unknown;
}

// Embed produk bisa objek atau array; RLS menyembunyikan produk nonaktif (null)
export function toGalleryEntries(rows: Row[]): GalleryEntry[] {
  return rows.map((g) => {
    const p = (Array.isArray(g.products) ? g.products[0] : g.products) as
      { slug: string; kind: string; is_active: boolean } | null | undefined;
    return {
      id: g.id, title: g.title, imageUrl: g.image_url, category: g.category,
      href: p?.is_active ? `${p.kind === "ready" ? "/shop" : "/product"}/${p.slug}` : null,
    };
  });
}
