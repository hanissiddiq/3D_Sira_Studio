import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { getBulkTiers } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).cart.title };
}

export default async function CartPage() {
  const [tiers, t] = await Promise.all([getBulkTiers(), getDict()]);
  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8">
      <h1 className="mb-6 text-2xl font-semibold">{t.cart.title}</h1>
      <CartView tiers={tiers} />
    </main>
  );
}
