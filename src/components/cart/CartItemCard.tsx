"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDict } from "@/components/layout/LanguageProvider";
import type { CartItem } from "@/hooks/useCart";
import { unitPrice } from "@/lib/pricing";
import { formatRupiah } from "@/lib/utils";

interface Props {
  item: CartItem;
  onQuantity: (q: number) => void;
  onRemove: () => void;
}

export function CartItemCard({ item, onQuantity, onRemove }: Props) {
  const t = useDict().cart;
  const price = unitPrice(item);
  const c = item.customization;
  return (
    <div className="flex gap-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
        {item.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt={t.design(item.name)} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        {!item.ready && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: c.primaryColor }} />
              {c.secondaryColor && <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: c.secondaryColor }} />}
            </span>
            {c.text && <span className="truncate">{t.textLabel(c.text)}</span>}
            {c.logoPath && <span>{t.logoLabel}</span>}
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="inline-flex items-center rounded-md border">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={t.decrease}
              onClick={() => onQuantity(item.quantity - 1)} disabled={item.quantity <= 1}><Minus className="h-3 w-3" /></Button>
            <span className="w-8 text-center text-sm" aria-live="polite">{item.quantity}</span>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={t.increase}
              onClick={() => onQuantity(item.quantity + 1)} disabled={item.quantity >= 500}><Plus className="h-3 w-3" /></Button>
          </div>
          <p className="text-sm font-medium">{formatRupiah(price * item.quantity)}</p>
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={t.remove(item.name)} onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
