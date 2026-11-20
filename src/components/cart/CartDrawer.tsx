"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDict } from "@/components/layout/LanguageProvider";
import { useCartHydrated, useCartStore } from "@/hooks/useCart";
import { computeTotals, type Tier } from "@/lib/pricing";
import { BulkDiscountBanner } from "./BulkDiscountBanner";
import { CartItemCard } from "./CartItemCard";
import { CartSummary } from "./CartSummary";

export function CartDrawer({ tiers }: { tiers: Tier[] }) {
  const open = useCartStore((s) => s.drawerOpen);
  const close = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const hydrated = useCartHydrated();
  const t = useDict().cart;
  const totals = computeTotals(items, tiers);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, close]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t.title}>
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-xl">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold">{t.title}</h2>
          <Button variant="ghost" size="icon" onClick={close} aria-label={t.close}><X className="h-5 w-5" /></Button>
        </header>

        {!hydrated || items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
            <ShoppingBag className="h-10 w-10" />
            <p className="text-sm">{hydrated ? t.empty : t.loading}</p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {items.map((item) => (
                <CartItemCard key={item.id} item={item}
                  onQuantity={(q) => updateQuantity(item.id, q)} onRemove={() => removeItem(item.id)} />
              ))}
            </div>
            <footer className="space-y-3 border-t p-4">
              <BulkDiscountBanner tiers={tiers} totalQty={totals.totalQty}
                discountPercent={totals.discountPercent} nextTier={totals.nextTier} />
              <CartSummary subtotal={totals.subtotal} discount={totals.discount}
                discountPercent={totals.discountPercent} total={totals.total} />
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" onClick={close}><Link href="/cart">{t.view}</Link></Button>
                <Button asChild onClick={close}><Link href="/checkout">{t.checkout}</Link></Button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
