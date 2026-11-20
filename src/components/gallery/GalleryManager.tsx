"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/products/FileUploader";
import {
  createGalleryItemAction, deleteGalleryItemAction, updateGalleryItemAction,
} from "@/app/(dashboard)/admin/gallery/actions";

export interface GalleryItemRow {
  id: string; title: string; image_url: string; product_id: string | null; category: string | null; is_published: boolean; sort_order: number;
}
export interface ProductOption { id: string; name_id: string }

const selectCls = "flex h-9 w-full rounded-md border bg-background px-3 text-sm";

function ProductSelect({ value, onChange, products }: { value: string | null; onChange: (v: string | null) => void; products: ProductOption[] }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={selectCls} aria-label="Produk terkait">
      <option value="">Tanpa tautan produk</option>
      {products.map((p) => <option key={p.id} value={p.id}>{p.name_id}</option>)}
    </select>
  );
}

function GalleryRow({ item, products }: { item: GalleryItemRow; products: ProductOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [productId, setProductId] = useState(item.product_id);
  const [category, setCategory] = useState(item.category ?? "");
  const [published, setPublished] = useState(item.is_published);
  const [order, setOrder] = useState(item.sort_order);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => startTransition(async () => {
    const res = await updateGalleryItemAction(item.id, { title, productId, category: category.trim() || null, isPublished: published, sortOrder: Number.isFinite(order) ? order : 0 });
    setMsg(res.ok ? { ok: true, text: "Tersimpan." } : { ok: false, text: res.error });
    if (res.ok) router.refresh();
  });
  const remove = () => {
    if (!window.confirm(`Hapus "${item.title}" beserta gambarnya?`)) return;
    startTransition(async () => {
      const res = await deleteGalleryItemAction(item.id);
      if (res.ok) router.refresh(); else setMsg({ ok: false, text: res.error });
    });
  };

  return (
    <div className="flex flex-col gap-4 border-b py-4 last:border-0 sm:flex-row">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.image_url} alt={item.title} className="h-32 w-32 shrink-0 rounded-md border object-cover" />
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label>Judul</Label><Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Produk terkait</Label><ProductSelect value={productId} onChange={setProductId} products={products} /></div>
        <div className="space-y-1.5"><Label>Kategori filter</Label>
          <Input value={category} maxLength={40} placeholder="mis. Gantungan Kunci" onChange={(e) => setCategory(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Urutan</Label>
          <Input type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Tampilkan di galeri</label>
        <div className="flex items-center justify-end gap-2 sm:col-span-2">
          {msg && <span role="status" className={msg.ok ? "text-sm text-green-700" : "text-sm text-red-600"}>{msg.text}</span>}
          <Button type="button" size="sm" onClick={save} disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={remove} disabled={pending} aria-label={`Hapus ${item.title}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GalleryManager({ items, products }: { items: GalleryItemRow[]; products: ProductOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [published, setPublished] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const create = () => {
    if (!imageUrl) return setError("Unggah gambar terlebih dahulu.");
    setError(null);
    startTransition(async () => {
      const res = await createGalleryItemAction({
        title, productId, category: newCategory.trim() || null, isPublished: published, imageUrl,
        sortOrder: items.length === 0 ? 0 : Math.max(...items.map((i) => i.sort_order)) + 1,
      });
      if (!res.ok) return setError(res.error);
      setTitle(""); setNewCategory(""); setProductId(null); setImageUrl(null); setPublished(true);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Tambah item galeri</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="g-title">Judul</Label>
              <Input id="g-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Produk terkait (opsional)</Label>
              <ProductSelect value={productId} onChange={setProductId} products={products} /></div>
            <div className="space-y-1.5"><Label htmlFor="g-cat">Kategori filter</Label>
              <Input id="g-cat" value={newCategory} maxLength={40} placeholder="mis. Gantungan Kunci" onChange={(e) => setNewCategory(e.target.value)} /></div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Pratinjau unggahan" className="h-20 w-20 rounded-md border object-cover" />
            )}
            <FileUploader folder="gallery" label={imageUrl ? "Ganti gambar" : "Unggah gambar"}
              accept="image/png,image/jpeg,image/webp" maxBytes={5 * 1024 * 1024}
              contentTypeFor={(f) => (["image/png", "image/jpeg", "image/webp"].includes(f.type) ? f.type : null)}
              onUploaded={setImageUrl} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Langsung tampilkan</label>
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <Button type="button" onClick={create} disabled={pending || !imageUrl || !title.trim()}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Item galeri ({items.length})</CardTitle></CardHeader>
        <CardContent>
          {items.length === 0
            ? <p className="py-6 text-center text-sm text-muted-foreground">Belum ada item.</p>
            : items.map((it) => <GalleryRow key={it.id} item={it} products={products} />)}
        </CardContent>
      </Card>
    </div>
  );
}
