import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { getBulkTiers } from "@/lib/data";

export const metadata: Metadata = { title: "Keranjang" };

export default async function CartPage() {
  const tiers = await getBulkTiers();
  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8">
      <h1 className="mb-6 text-2xl font-semibold">Keranjang</h1>
      <CartView tiers={tiers} />
    </main>
  );
}
