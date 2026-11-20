import type { Metadata } from "next";
import { OrderLookup } from "@/components/orders/OrderLookup";

export const metadata: Metadata = { title: "Lacak Pesanan" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return (
    <main className="mx-auto max-w-lg p-4 md:p-8">
      <h1 className="mb-6 text-2xl font-semibold">Lacak pesanan</h1>
      <OrderLookup initialCode={code && /^SIRA-[A-F0-9]{8}$/i.test(code) ? code.toUpperCase() : undefined} />
    </main>
  );
}
