"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDict } from "@/components/layout/LanguageProvider";
import { Card, CardContent } from "@/components/ui/card";
import { useCartHydrated, useCartStore } from "@/hooks/useCart";
import { computeTotals, type Tier } from "@/lib/pricing";
import { BulkDiscountBanner } from "./BulkDiscountBanner";
import { CartItemCard } from "./CartItemCard";
import { CartSummary } from "./CartSummary";

export function CartView({ tiers }: { tiers: Tier[] }) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const hydrated = useCartHydrated();
  const t = useDict().cart;
  const totals = computeTotals(items, tiers);

  if (!hydrated) return <p className="text-sm text-muted-foreground">{t.loading}</p>;
  if (items.length === 0) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">{t.empty}</p>
        <Button asChild><Link href="/product">{t.browse}</Link></Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {items.map((item) => (
          <CartItemCard key={item.id} item={item}
            onQuantity={(q) => updateQuantity(item.id, q)} onRemove={() => removeItem(item.id)} />
        ))}
      </div>
      <Card className="h-fit">
        <CardContent className="space-y-4 pt-6">
          <BulkDiscountBanner tiers={tiers} totalQty={totals.totalQty}
            discountPercent={totals.discountPercent} nextTier={totals.nextTier} />
          <CartSummary subtotal={totals.subtotal} discount={totals.discount}
            discountPercent={totals.discountPercent} total={totals.total} />
          <p className="text-xs text-muted-foreground">{t.shippingNote}</p>
          <Button asChild className="w-full"><Link href="/checkout">{t.toCheckout}</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
