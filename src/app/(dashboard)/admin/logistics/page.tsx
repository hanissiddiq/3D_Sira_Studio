import type { Metadata } from "next";
import Link from "next/link";
import { Archive, Banknote, ScanLine, Truck } from "lucide-react";
import { AdvanceButton } from "@/components/admin/AdvanceButton";
import { DispatchForm } from "@/components/admin/DispatchForm";
import { ThermalLabel } from "@/components/admin/ThermalLabel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABEL, formatDateTime, isOrderStatus } from "@/lib/order-status";
import { cn, formatRupiah } from "@/lib/utils";
import { one } from "@/lib/workshop";

export const metadata: Metadata = { title: "Logistik & Kirim" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
interface Addr { address: string; city: string; province: string; postalCode: string }

export default async function LogisticsPage({ searchParams }: { searchParams: Promise<{ tab?: string; order?: string; scan?: string }> }) {
  await requirePermission("workshop:manage");
  const sp = await searchParams;
  const tab = sp.tab === "shipped" ? "shipped" : "packing";
  const supabase = await createClient();

  const select = "id, order_code, customer_name, customer_phone, total, status, courier, tracking_number, packed_weight_grams, box_size, shipping_address, created_at, order_items ( product_name, quantity )";
  const [packing, shipped, log] = await Promise.all([
    supabase.from("orders").select(select).eq("status", "packing").order("created_at", { ascending: true }),
    supabase.from("orders").select(select).eq("status", "shipped").order("created_at", { ascending: false }).limit(50),
    supabase.from("order_status_history").select("status, note, created_at, orders ( order_code )")
      .in("status", ["packing", "shipped", "completed"]).order("created_at", { ascending: false }).limit(6),
  ]);
  if (packing.error || shipped.error) {
    console.error("logistics:", packing.error ?? shipped.error);
    return <p className="text-sm text-red-600">Gagal memuat logistik.</p>;
  }

  const all = [...packing.data, ...shipped.data];
  // Scanner serah-terima: cocokkan resi / kode pesanan (huruf besar-kecil diabaikan)
  const scan = (sp.scan ?? "").trim().slice(0, 60).toLowerCase();
  const scanned = scan ? all.find((o) => o.tracking_number?.toLowerCase() === scan || o.order_code.toLowerCase() === scan) : undefined;
  const selectedId = scanned?.id ?? (sp.order && UUID_RE.test(sp.order) ? sp.order : undefined);
  const selected = all.find((o) => o.id === selectedId) ?? (tab === "packing" ? packing.data[0] : shipped.data[0]);
  const list = tab === "packing" ? packing.data : shipped.data;
  const activeTab = scanned ? (scanned.status === "shipped" ? "shipped" : "packing") : tab;
  const shownList = scanned ? (activeTab === "packing" ? packing.data : shipped.data) : list;

  const stats = [
    { label: "Paket siap kirim", icon: Archive, bg: "bg-powder", big: `${packing.data.length} Paket`, sub: "Status Packing & Kurir" },
    { label: "Dalam transit", icon: Truck, bg: "bg-mint-soft", big: `${shipped.data.length} Paket`, sub: "Sudah diserahkan ke kurir" },
    { label: "Nilai paket siap kirim", icon: Banknote, bg: "bg-lilac-soft", big: formatRupiah(packing.data.reduce((s, o) => s + o.total, 0)), sub: "Total pesanan packing" },
  ];

  const labelData = selected && {
    orderCode: selected.order_code, tracking: selected.tracking_number, courier: (selected.courier ?? "kurir").replace(":", " "),
    consignee: selected.customer_name, phone: selected.customer_phone,
    address: (() => { const a = selected.shipping_address as Addr; return `${a.address}, ${a.city}, ${a.province} ${a.postalCode}`; })(),
    weightGrams: selected.packed_weight_grams, box: selected.box_size,
    itemCount: (selected.order_items as { quantity: number }[]).reduce((n, i) => n + i.quantity, 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-label text-xs font-bold text-muted-foreground">Workshop › QC & Packing › Dispatch Hub</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Terminal Dispatch Logistik & Serah Terima Kurir</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(({ label, icon: Icon, bg, big, sub }) => (
          <div key={label} className={cn("rounded-xl border-2 border-ink p-4 text-on-pastel shadow-cartoon dark:text-foreground", bg)}>
            <div className="flex items-center justify-between font-label text-[11px] font-bold uppercase tracking-wider">{label}<Icon className="h-4 w-4" /></div>
            <p className="mt-2 text-2xl font-extrabold">{big}</p><p className="text-xs opacity-80">{sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Status pengiriman">
        {([["packing", `Siap Kirim (${packing.data.length})`], ["shipped", `Dalam Transit (${shipped.data.length})`]] as const).map(([key, label]) => (
          <Link key={key} href={`/admin/logistics?tab=${key}`} role="tab" aria-selected={activeTab === key}
            className={cn("rounded-full border-2 px-4 py-1.5 font-label text-xs font-bold", activeTab === key ? "border-ink bg-primary text-white shadow-cartoon" : "border-ink/30 bg-card hover:border-ink")}>
            {label}
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {shownList.length === 0 && <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Tidak ada paket pada tab ini.</CardContent></Card>}
          {shownList.map((o) => {
            const a = o.shipping_address as Addr;
            const isSel = selected?.id === o.id;
            return (
              <article key={o.id} className={cn("space-y-3 rounded-xl border-2 border-ink bg-card p-4 shadow-cartoon", isSel && "ring-4 ring-primary/30")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link href={`/admin/orders/${o.id}`} className="font-label text-xs font-bold text-primary hover:underline">#{o.order_code}</Link>
                    <p className="font-extrabold">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{a.address}, {a.city}, {a.province} {a.postalCode} · {o.customer_phone}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="sky">{(o.courier ?? "—").replace(":", " ")}</Badge>
                    <Badge tone={o.status === "shipped" ? "mintStrong" : "butter"}>{isOrderStatus(o.status) ? STATUS_LABEL[o.status] : o.status}</Badge>
                  </div>
                </div>
                <ul className="space-y-0.5 text-sm">
                  {(o.order_items as { product_name: string; quantity: number }[]).map((it, i) => <li key={i}>• {it.quantity}× {it.product_name}</li>)}
                </ul>
                {o.status === "packing" ? (
                  <DispatchForm orderId={o.id} tracking={o.tracking_number} weightGrams={o.packed_weight_grams} box={o.box_size} />
                ) : (
                  <div className="grid gap-1 rounded-xl border-2 border-ink bg-muted p-3 text-sm sm:grid-cols-3">
                    <p><span className="font-label text-[10px] font-bold text-muted-foreground">RESI</span><br /><span className="font-label font-bold text-primary">{o.tracking_number ?? "—"}</span></p>
                    <p><span className="font-label text-[10px] font-bold text-muted-foreground">BERAT</span><br />{o.packed_weight_grams ? `${o.packed_weight_grams} g` : "—"}</p>
                    <p><span className="font-label text-[10px] font-bold text-muted-foreground">BOX</span><br />{o.box_size ?? "—"}</p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline"><Link href={`/admin/logistics?tab=${activeTab}&order=${o.id}`}>Preview Resi</Link></Button>
                  {o.status === "shipped" && <div className="w-44"><AdvanceButton orderId={o.id} to="completed" label="Tandai Selesai" variant="secondary" /></div>}
                  <span className="ml-auto font-label text-[11px] text-muted-foreground">{formatDateTime(o.created_at)}</span>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ScanLine className="h-5 w-5" />Handover Scanner</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Arahkan scanner fisik atau ketik nomor resi / kode pesanan.</p>
              <form method="GET" className="flex gap-2">
                <input name="scan" defaultValue={sp.scan ?? ""} placeholder="Scan barcode resi kurir…" autoComplete="off" autoFocus
                  className="h-10 min-w-0 flex-1 rounded-full px-4 font-label text-sm font-bold" />
                <Button type="submit" size="sm">Cari</Button>
              </form>
              {scan && !scanned && <p role="alert" className="text-xs text-red-600">Tidak ada paket dengan resi / kode tersebut.</p>}
              {scanned && <p role="status" className="text-xs font-bold text-secondary-foreground dark:text-secondary">Ditemukan: #{scanned.order_code}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Preview Resi Termal</CardTitle></CardHeader>
            <CardContent>
              {labelData ? <ThermalLabel key={selected!.id + (selected!.tracking_number ?? "")} data={labelData} />
                : <p className="text-sm text-muted-foreground">Pilih paket untuk melihat label.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Log Dispatch Terakhir</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(log.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>}
              {(log.data ?? []).map((l, i) => {
                const ord = one(l.orders as { order_code: string } | { order_code: string }[] | null);
                return (
                  <div key={i} className="rounded-xl border-[1.5px] border-ink bg-muted p-2.5 text-sm">
                    <p className="font-bold">{isOrderStatus(l.status) ? STATUS_LABEL[l.status] : l.status} · #{ord?.order_code ?? "—"}</p>
                    <p className="font-label text-[11px] text-muted-foreground">{formatDateTime(l.created_at)}{l.note ? ` · ${l.note}` : ""}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
