import type { Metadata } from "next";
import { Banknote, Clock, Hammer, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

interface Stats {
  pending_payment: number;
  to_process: number;
  in_production: number;
  revenue_month: number;
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Menunggu pembayaran",
  paid: "Dibayar",
  in_production: "Produksi",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient(); // memakai session staff -> RLS berlaku

  const [statsRes, reviewsRes, ordersRes] = await Promise.all([
    supabase.rpc("admin_dashboard_stats"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders")
      .select("id, order_code, customer_name, total, status, created_at")
      .order("created_at", { ascending: false }).limit(5),
  ]);

  if (statsRes.error || ordersRes.error) {
    console.error("Dashboard error:", statsRes.error ?? ordersRes.error);
    return <p className="text-sm text-red-600">Gagal memuat data dashboard.</p>;
  }

  const stats = statsRes.data as unknown as Stats;
  const cards = [
    { title: "Menunggu pembayaran", value: stats.pending_payment, icon: Clock },
    { title: "Perlu diproses", value: stats.to_process, icon: Hammer },
    { title: "Ulasan menunggu moderasi", value: reviewsRes.count ?? 0, icon: MessageSquare },
    { title: "Omzet bulan ini", value: formatRupiah(stats.revenue_month), icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Pesanan terbaru</CardTitle></CardHeader>
        <CardContent>
          {ordersRes.data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Belum ada pesanan.</p>
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
                  {ordersRes.data.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono">{o.order_code}</td>
                      <td className="py-2 pr-4">{o.customer_name}</td>
                      <td className="py-2 pr-4">{formatRupiah(o.total)}</td>
                      <td className="py-2 pr-4">{STATUS_LABEL[o.status] ?? o.status}</td>
                      <td className="py-2">{new Date(o.created_at).toLocaleDateString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
