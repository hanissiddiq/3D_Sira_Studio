export interface Tier { min_quantity: number; percent: number }

interface PriceableItem {
  basePrice: number; textFee: number; logoFee: number; quantity: number;
  customization: { text?: string; logoPath?: string };
}

export function unitPrice(i: PriceableItem) {
  return i.basePrice + (i.customization.text ? i.textFee : 0) + (i.customization.logoPath ? i.logoFee : 0);
}

export function computeTotals(items: PriceableItem[], tiers: Tier[]) {
  const subtotal = items.reduce((s, i) => s + unitPrice(i) * i.quantity, 0);
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const sorted = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity);
  const tier = sorted.find((t) => totalQty >= t.min_quantity) ?? null;
  const discountPercent = tier ? tier.percent : 0;
  const discount = Math.round((subtotal * discountPercent) / 100);
  const nextTier = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity)
    .find((t) => t.min_quantity > totalQty) ?? null;
  return { subtotal, totalQty, discountPercent, discount, nextTier, total: subtotal - discount };
}
