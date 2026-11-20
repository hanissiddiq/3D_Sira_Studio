"use client";
import { useEffect } from "react";
import { useCartStore } from "@/hooks/useCart";

export function CartHydrator() {
  useEffect(() => { void useCartStore.persist.rehydrate(); }, []);
  return null;
}
