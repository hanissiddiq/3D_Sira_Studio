import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = { title: "Produk" };

export default async function AdminProductsPage() {
  await requirePermission("products:write");
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, slug, name_id, category, kind, base_price, is_active, images, model_url")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("products list:", error);
    return <p className="text-sm text-red-600">Gagal memuat produk.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produk</h1>
        <Button asChild><Link href="/admin/products/new"><Plus className="mr-2 h-4 w-4" /> Tambah produk</Link></Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada produk.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Produk</th>
                    <th className="py-2 pr-4 font-medium">Kategori</th>
                    <th className="py-2 pr-4 font-medium">Jenis</th>
                    <th className="py-2 pr-4 font-medium">Harga</th>
                    <th className="py-2 pr-4 font-medium">Model 3D</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-4">
                        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                          {p.images?.[0]
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={p.images[0]} alt="" className="h-10 w-10 rounded border object-cover" />
                            : <span className="h-10 w-10 rounded border bg-muted" />}
                          <span><span className="block font-medium">{p.name_id}</span><span className="text-xs text-muted-foreground">/{p.slug}</span></span>
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{p.category}</td>
                      <td className="py-2 pr-4">{p.kind === "ready" ? "Siap beli" : "Rancang"}</td>
                      <td className="py-2 pr-4">{formatRupiah(p.base_price)}</td>
                      <td className="py-2 pr-4">{p.model_url ? "Ada" : "—"}</td>
                      <td className="py-2">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium",
                          p.is_active ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground")}>
                          {p.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
