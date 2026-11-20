import type { Metadata } from "next";
import { OrderLookup } from "@/components/orders/OrderLookup";
import { getDict } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).orders.title };
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const [{ code }, t] = await Promise.all([searchParams, getDict()]);
  return (
    <main className="mx-auto max-w-lg p-4 md:p-8">
      <h1 className="mb-6 text-2xl font-semibold">{t.orders.title}</h1>
      <OrderLookup initialCode={code && /^SIRA-[A-F0-9]{8}$/i.test(code) ? code.toUpperCase() : undefined} />
    </main>
  );
}
