"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThreeCanvasLazy } from "@/components/customizer/ThreeCanvasLazy";
import { useDict } from "@/components/layout/LanguageProvider";
import { useCartStore } from "@/hooks/useCart";
import { formatRupiah } from "@/lib/utils";
import { DEFAULT_CUSTOMIZER_CONFIG } from "@/lib/validations/product";

interface Props {
  productId: string; slug: string; name: string; description: string;
  images: string[]; modelUrl: string | null; basePrice: number; stock: number | null;
}

export function ShopProductView({ productId, slug, name, description, images, modelUrl, basePrice, stock }: Props) {
  const t = useDict().product;
  const l = useDict().landing;
  const soldOut = stock !== null && stock <= 0;
  const maxQty = stock === null ? 500 : Math.max(1, Math.min(500, stock));
  const [active, setActive] = useState(0);
  const [show3d, setShow3d] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const add = () => {
    addItem({
      productId, slug, name, basePrice, textFee: 0, logoFee: 0, quantity, ready: true,
      thumbnail: images[0],
      customization: { primaryColor: DEFAULT_CUSTOMIZER_CONFIG.primary.defaultColor, font: "sans" },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    openDrawer();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="aspect-square overflow-hidden rounded-xl border bg-muted">
          {show3d && modelUrl ? (
            <ThreeCanvasLazy className="h-full w-full" modelUrl={modelUrl}
              config={DEFAULT_CUSTOMIZER_CONFIG}
              state={{ primaryColor: DEFAULT_CUSTOMIZER_CONFIG.primary.defaultColor, font: "sans" }} />
          ) : images[active] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[active]} alt={name} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {images.map((url, i) => (
            <button key={url} type="button" onClick={() => { setActive(i); setShow3d(false); }}
              aria-label={`${name} ${i + 1}`} aria-pressed={!show3d && active === i}
              className={`h-16 w-16 overflow-hidden rounded-md border-2 ${!show3d && active === i ? "border-primary" : "border-transparent"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          {modelUrl && (
            <Button type="button" variant="outline" size="sm" onClick={() => setShow3d((v) => !v)}>
              {show3d ? t.viewPhotos : t.view3d}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <h1 className="text-3xl font-semibold">{name}</h1>
        <p className="font-label text-2xl font-bold">{formatRupiah(basePrice)}</p>
        {stock !== null && <p className="font-label text-sm font-bold text-muted-foreground">{soldOut ? l.readySoldOut : l.readyStock(stock)}</p>}
        {description && <p className="whitespace-pre-line text-muted-foreground">{description}</p>}
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="shop-qty">{t.quantity}</Label>
            <Input id="shop-qty" type="number" min={1} max={maxQty} className="w-24" value={quantity}
              onChange={(e) => setQuantity(Math.min(maxQty, Math.max(1, Math.floor(Number(e.target.value)) || 1)))} />
          </div>
          <Button type="button" className="flex-1" onClick={add} disabled={soldOut}>
            {added ? <Check className="mr-2 h-4 w-4" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
            {soldOut ? l.readySoldOut : t.addToCart}
          </Button>
        </div>
      </div>
    </div>
  );
}
