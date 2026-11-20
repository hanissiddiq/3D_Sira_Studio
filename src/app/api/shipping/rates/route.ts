import { NextResponse } from "next/server";
import { z } from "zod";
import { getTotalWeightGrams } from "@/services/pricingService";
import { getShippingOptions } from "@/services/shippingService";

const bodySchema = z.object({
  province: z.string().trim().min(2).max(100),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(500),
  })).min(1).max(50),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Permintaan tidak valid." }, { status: 400 });
  }
  try {
    const totalWeightGrams = await getTotalWeightGrams(parsed.data.items);
    const options = getShippingOptions({ province: parsed.data.province, totalWeightGrams });
    return NextResponse.json({ ok: true, options });
  } catch (e) {
    if (e instanceof Error && e.message === "PRODUCT_UNAVAILABLE") {
      return NextResponse.json({ ok: false, error: "Ada produk yang tidak tersedia." }, { status: 422 });
    }
    console.error("shipping rates:", e);
    return NextResponse.json({ ok: false, error: "Gagal menghitung ongkir." }, { status: 500 });
  }
}
