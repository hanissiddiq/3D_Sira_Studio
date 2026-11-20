"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartHydrated, useCartStore } from "@/hooks/useCart";

export function CartButton() {
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const open = useCartStore((s) => s.openDrawer);
  const hydrated = useCartHydrated();
  return (
    <Button variant="ghost" size="icon" onClick={open} className="relative"
      aria-label={hydrated && count > 0 ? `Buka keranjang, ${count} item` : "Buka keranjang"}>
      <ShoppingBag className="h-5 w-5" />
      {hydrated && count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  );
}
