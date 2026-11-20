import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateOrderInput } from "@/lib/validations/order";

export interface PricedItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}
export interface PricingResult {
  items: PricedItem[];
  subtotal: number;
  discountPercent: number;
  discount: number;
  totalWeightGrams: number;
}

/** Harga SELALU dihitung ulang di server dari database; harga dari client diabaikan. */
export async function calculatePricing(
  items: CreateOrderInput["items"],
): Promise<PricingResult> {
  const admin = createAdminClient();
  const ids = [...new Set(items.map((i) => i.productId))];

  const [{ data: products, error: pErr }, { data: tiers, error: tErr }] = await Promise.all([
    admin.from("products")
      .select("id, name_id, base_price, text_fee, logo_fee, weight_grams, is_active").in("id", ids),
    admin.from("bulk_discount_tiers").select("min_quantity, percent")
      .order("min_quantity", { ascending: false }),
  ]);
  if (pErr || tErr) throw new Error("Gagal memuat data harga");

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  let totalQty = 0;
  let totalWeightGrams = 0;

  const priced: PricedItem[] = items.map((item) => {
    const p = byId.get(item.productId);
    if (!p || !p.is_active) throw new Error("PRODUCT_UNAVAILABLE");
    const unitPrice =
      p.base_price +
      (item.customization.text ? p.text_fee : 0) +
      (item.customization.logoPath ? p.logo_fee : 0);
    totalQty += item.quantity;
    totalWeightGrams += p.weight_grams * item.quantity;
    return { productId: p.id, productName: p.name_id, quantity: item.quantity, unitPrice };
  });

  const subtotal = priced.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tier = (tiers ?? []).find((t) => totalQty >= t.min_quantity);
  const discountPercent = tier ? Number(tier.percent) : 0;
  const discount = Math.round((subtotal * discountPercent) / 100);

  return { items: priced, subtotal, discountPercent, discount, totalWeightGrams };
}

/** Berat total untuk estimasi ongkir (tanpa kustomisasi). */
export async function getTotalWeightGrams(
  items: { productId: string; quantity: number }[],
): Promise<number> {
  const admin = createAdminClient();
  const ids = [...new Set(items.map((i) => i.productId))];
  const { data, error } = await admin
    .from("products").select("id, weight_grams, is_active").in("id", ids);
  if (error) throw new Error("Gagal memuat data produk");
  const byId = new Map((data ?? []).map((p) => [p.id, p]));
  return items.reduce((sum, item) => {
    const p = byId.get(item.productId);
    if (!p || !p.is_active) throw new Error("PRODUCT_UNAVAILABLE");
    return sum + p.weight_grams * item.quantity;
  }, 0);
}
