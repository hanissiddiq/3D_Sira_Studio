import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES, STATUS_LABEL, formatDateTime, isOrderStatus } from "@/lib/order-status";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = { title: "Pesanan" };

const PAGE_SIZE = 20;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requirePermission("orders:read");
  const sp = await searchParams;

  const status = isOrderStatus(sp.status) ? sp.status : undefined;
  // Buang karakter yang bermakna di sintaks filter PostgREST (, ( ) % * \)
  const q = (sp.q ?? "").replace(/[^\w\s@.\-]/g, "").trim().slice(0, 50);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, order_code, customer_name, total, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`order_code.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`);

  const { data: orders, count, error } = await query;
  if (error) {
    console.error("orders list:", error);
    return <p className="text-sm text-red-600">Gagal memuat pesanan.</p>;
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pesanan</h1>

      <form method="GET" className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Cari kode, nama, atau email"
          className="h-9 min-w-56 flex-1 rounded-md border bg-background px-3 text-sm" />
        <select name="status" defaultValue={status ?? ""}
          className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="">Semua status</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <Button type="submit">Filter</Button>
      </form>

      <Card>
        <CardContent className="pt-6">
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada pesanan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Kode</th>
                    <th className="py-2 pr-4 font-medium">Pelanggan</th>
                    <th className="py-2 pr-4 font-medium">Total</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-4 font-mono">
                        <Link href={`/admin/orders/${o.id}`} className="underline-offset-4 hover:underline">
                          {o.order_code}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{o.customer_name}</td>
                      <td className="py-2 pr-4">{formatRupiah(o.total)}</td>
                      <td className="py-2 pr-4"><OrderStatusBadge status={o.status} /></td>
                      <td className="py-2 whitespace-nowrap">{formatDateTime(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Halaman {page} dari {totalPages} · {count} pesanan</span>
          <div className="flex gap-2">
            {page > 1 && <Button asChild variant="outline" size="sm"><Link href={pageHref(page - 1)}>Sebelumnya</Link></Button>}
            {page < totalPages && <Button asChild variant="outline" size="sm"><Link href={pageHref(page + 1)}>Berikutnya</Link></Button>}
          </div>
        </div>
      )}
    </div>
  );
}
