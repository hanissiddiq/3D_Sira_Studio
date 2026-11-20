import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { getBulkTiers } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).checkout.title };
}

export default async function CheckoutPage() {
  const [tiers, t] = await Promise.all([getBulkTiers(), getDict()]);
  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8">
      <h1 className="mb-6 text-2xl font-semibold">{t.checkout.title}</h1>
      <CheckoutForm tiers={tiers} />
    </main>
  );
}
