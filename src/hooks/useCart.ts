"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartFont = "sans" | "serif" | "mono" | "display";

export interface CartItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  basePrice: number;   // hanya untuk tampilan; server menghitung ulang harga
  textFee: number;
  logoFee: number;
  quantity: number;
  thumbnail?: string;  // data URL kecil (custom) atau URL foto produk (siap beli)
  ready?: boolean;     // produk siap beli: item identik digabung
  customization: {
    primaryColor: string;
    secondaryColor?: string;
    text?: string;
    font: CartFont;
    logoPath?: string;
    snapshotPath?: string;
  };
}

interface CartState {
  items: CartItem[];
  drawerOpen: boolean;
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const clampQty = (q: number) => Math.min(500, Math.max(1, Math.floor(q) || 1));

function isCartItem(v: unknown): v is CartItem {
  const i = v as CartItem;
  return !!i && typeof i.id === "string" && typeof i.productId === "string" &&
    typeof i.quantity === "number" && typeof i.basePrice === "number" &&
    !!i.customization && typeof i.customization.primaryColor === "string";
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      drawerOpen: false,
      addItem: (item) => set((s) => {
        if (item.ready) {
          const existing = s.items.find((i) => i.ready && i.productId === item.productId);
          if (existing) {
            return { items: s.items.map((i) => (i.id === existing.id ? { ...i, quantity: clampQty(i.quantity + item.quantity) } : i)) };
          }
        }
        return { items: [...s.items, { ...item, id: crypto.randomUUID(), quantity: clampQty(item.quantity) }] };
      }),
      updateQuantity: (id, quantity) => set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, quantity: clampQty(quantity) } : i)),
      })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
    }),
    {
      name: "sira-cart-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
      skipHydration: true, // di-rehydrate di client (CartHydrator) agar tidak mismatch dengan SSR
      merge: (persisted, current) => {
        const raw = (persisted as { items?: unknown } | undefined)?.items;
        return { ...current, items: Array.isArray(raw) ? raw.filter(isCartItem) : [] };
      },
    },
  ),
);

export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    if (useCartStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
