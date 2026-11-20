import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { getBulkTiers } from "@/lib/data";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const tiers = await getBulkTiers();
  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8">
      <h1 className="mb-6 text-2xl font-semibold">Checkout</h1>
      <CheckoutForm tiers={tiers} />
    </main>
  );
}
