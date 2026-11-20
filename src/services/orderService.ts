import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePricing } from "@/services/pricingService";
import { getShippingOptions } from "@/services/shippingService";
import type { CreateOrderInput } from "@/lib/validations/order";

export class OrderError extends Error {
  constructor(public code: "PRODUCT_UNAVAILABLE" | "SHIPPING_INVALID" | "ASSET_MISSING" | "DB_ERROR", message: string) {
    super(message);
  }
}

export async function createOrder(input: CreateOrderInput) {
  let pricing;
  try {
    pricing = await calculatePricing(input.items);
  } catch (e) {
    if (e instanceof Error && e.message === "PRODUCT_UNAVAILABLE") {
      throw new OrderError("PRODUCT_UNAVAILABLE", "Ada produk yang sudah tidak tersedia.");
    }
    throw new OrderError("DB_ERROR", "Gagal menghitung harga.");
  }

  // Ongkir dihitung ulang di server; pilihan kurir dari client harus cocok dengan opsi yang ditawarkan.
  const option = getShippingOptions({
    province: input.shipping.province,
    totalWeightGrams: pricing.totalWeightGrams,
  }).find((o) => o.courier === input.shipping.courier && o.service === input.shipping.service);
  if (!option) throw new OrderError("SHIPPING_INVALID", "Opsi pengiriman tidak valid.");

  const admin = createAdminClient();

  // File logo/snapshot harus benar-benar ada di storage (path berasal dari client).
  const assets: { bucket: string; path: string }[] = [];
  for (const i of input.items) {
    if (i.customization.logoPath) assets.push({ bucket: "customer-uploads", path: i.customization.logoPath });
    if (i.customization.snapshotPath) assets.push({ bucket: "design-snapshots", path: i.customization.snapshotPath });
  }
  for (const { bucket, path } of assets) {
    const { data: exists } = await admin.storage.from(bucket).exists(path);
    if (!exists) {
      throw new OrderError("ASSET_MISSING", "File desain tidak ditemukan. Hapus item dari keranjang lalu tambahkan ulang.");
    }
  }

  const { data, error } = await admin.rpc("create_order", {
    p_customer: input.customer,
    p_shipping: input.shipping,
    p_courier: `${option.courier}:${option.service}`,
    p_subtotal: pricing.subtotal,
    p_discount: pricing.discount,
    p_shipping_cost: option.cost,
    p_items: pricing.items.map((pi, idx) => ({
      ...pi,
      customization: input.items[idx].customization,
    })),
  });

  const row = data?.[0];
  if (error || !row) {
    console.error("create_order failed:", error);
    throw new OrderError("DB_ERROR", "Gagal membuat pesanan. Silakan coba lagi.");
  }

  return { orderCode: row.out_code, total: row.out_total, discount: pricing.discount, shippingCost: option.cost };
}

/** Lookup tamu: kode pesanan + email. Hanya mengembalikan data non-sensitif. */
export async function lookupOrder(orderCode: string, email: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(`order_code, status, payment_status, total, courier, tracking_number, created_at,
      order_items ( id, product_name, quantity, unit_price ),
      order_status_history ( status, note, created_at )`)
    .eq("order_code", orderCode)
    .eq("customer_email", email) // email disimpan lowercase (schema Zod)
    .maybeSingle();
  if (error) console.error("lookupOrder failed:", error);
  return data ?? null; // tidak membedakan "kode salah" vs "email salah"
}
