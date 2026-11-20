import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = { title: "Produk" };

export default async function ProductListPage() {
  const supabase = await createClient(); // anon/publik: RLS hanya mengembalikan produk aktif
  const { data: products, error } = await supabase
    .from("products")
    .select("slug, name_id, base_price, images, category")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("storefront products:", error);
    return <p className="p-8 text-sm text-red-600">Gagal memuat produk.</p>;
  }

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <h1 className="mb-6 text-2xl font-semibold">Produk</h1>
      {products.length === 0 ? (
        <p className="text-muted-foreground">Belum ada produk.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p.slug} href={`/product/${p.slug}`} className="group overflow-hidden rounded-xl border">
              <div className="aspect-square bg-muted">
                {p.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name_id} className="h-full w-full object-cover transition group-hover:scale-105" />
                )}
              </div>
              <div className="p-4">
                <p className="font-medium">{p.name_id}</p>
                <p className="text-sm text-muted-foreground">Mulai {formatRupiah(p.base_price)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
