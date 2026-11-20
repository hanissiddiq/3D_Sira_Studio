import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, CheckCircle2, ClipboardCheck, Cpu, Package, Printer, Search, Truck } from "lucide-react";
import { AdvanceButton } from "@/components/admin/AdvanceButton";
import { ProgressBar } from "@/components/admin/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/order-status";
import { cn, formatRupiah } from "@/lib/utils";
import { formatMinutes, isExpress, one, printProgress } from "@/lib/workshop";

export const metadata: Metadata = { title: "Antrean Cetak" };

const COLUMNS = [
  { status: "paid", title: "Validasi & Slicing", icon: ClipboardCheck, wrap: "border-accent bg-peach-soft/40", chip: "peach" },
  { status: "in_production", title: "Sedang Dicetak", icon: Printer, wrap: "border-primary bg-powder/40", chip: "sky" },
  { status: "qc_finishing", title: "QC & Finishing", icon: CheckCircle2, wrap: "border-lilac bg-lilac-soft/40", chip: "lilac" },
  { status: "packing", title: "Packing & Kurir", icon: Truck, wrap: "border-secondary bg-mint-soft/40", chip: "mint" },
] as const;

const PRINTER_TONE: Record<string, string> = {
  idle: "bg-mint-soft", printing: "bg-powder", eject: "bg-peach-soft", maintenance: "bg-butter-soft", offline: "bg-muted",
};
const PRINTER_LABEL: Record<string, string> = {
  idle: "IDLE", printing: "CETAK", eject: "EJECT BED", maintenance: "SERVIS", offline: "OFFLINE",
};

export default async function QueueBoardPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("workshop:manage");
  const sp = await searchParams;
  const q = (sp.q ?? "").replace(/[^\w\s@.\-]/g, "").trim().slice(0, 50).toLowerCase();

  const supabase = await createClient();
  const [ordersRes, printersRes, materialsRes, statsRes] = await Promise.all([
    supabase.from("orders")
      .select("id, order_code, customer_name, total, status, courier, created_at, order_items ( product_name, quantity ), print_jobs ( est_minutes, started_at, printers ( name ) )")
      .in("status", ["paid", "in_production", "qc_finishing", "packing"]).order("created_at", { ascending: true }),
    supabase.from("printers").select("id, name, status, current_label").order("name"),
    supabase.from("materials").select("stock_rolls, grams_per_roll, low_stock_rolls"),
    supabase.rpc("admin_dashboard_stats"),
  ]);
  if (ordersRes.error || printersRes.error || materialsRes.error) {
    console.error("queue board:", ordersRes.error ?? printersRes.error ?? materialsRes.error);
    return <p className="text-sm text-red-600">Gagal memuat papan antrean.</p>;
  }

  const orders = ordersRes.data.filter((o) => !q || o.order_code.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q));
  const printers = printersRes.data;
  const busy = printers.filter((p) => p.status === "printing" || p.status === "eject").length;
  const util = printers.length ? Math.round((busy / printers.length) * 100) : 0;
  const waiting = ordersRes.data.filter((o) => o.status === "paid");
  const kg = materialsRes.data.reduce((s, m) => s + (Number(m.stock_rolls) * m.grams_per_roll) / 1000, 0);
  const low = materialsRes.data.filter((m) => Number(m.stock_rolls) <= Number(m.low_stock_rolls)).length;
  const revenue = (statsRes.data as { revenue_month?: number } | null)?.revenue_month ?? 0;

  const stats = [
    { label: "Printer aktif", icon: Cpu, bg: "bg-powder", big: `${busy} / ${printers.length}`, sub: `Utilisasi ${util}%`, bar: util },
    { label: "Menunggu slicing", icon: ClipboardCheck, bg: "bg-peach-soft", big: `${waiting.length} Job`, sub: `${waiting.filter((o) => isExpress(o.courier)).length} ekspres` },
    { label: "Stok material", icon: Package, bg: "bg-mint-soft", big: `${kg.toFixed(2)} kg`, sub: low > 0 ? `${low} material menipis` : "Stok aman" },
    { label: "Omzet bulan ini", icon: Banknote, bg: "bg-lilac-soft", big: formatRupiah(revenue), sub: "Pesanan lunas" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-label text-xs font-bold text-muted-foreground"><span className="rounded-full border-2 border-ink bg-blush-soft px-2.5 py-0.5 text-on-pastel">WORKSHOP TELEMETRY</span></p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Papan Antrean Cetak & Kontrol Produksi 🎨</h1>
          <p className="text-sm text-muted-foreground">Pantau pesanan dari validasi, pencetakan, QC, hingga siap kirim.</p>
        </div>
        <Button asChild variant="outline"><Link href="/admin/slicing"><ClipboardCheck /> Slicing & Validasi</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, icon: Icon, bg, big, sub, bar }) => (
          <div key={label} className={cn("rounded-xl border-2 border-ink p-4 shadow-cartoon", bg)}>
            <div className="flex items-center justify-between font-label text-[11px] font-bold uppercase tracking-wider text-on-pastel dark:text-foreground">{label}<Icon className="h-4 w-4" /></div>
            <p className="mt-2 text-2xl font-extrabold text-on-pastel dark:text-foreground">{big}</p>
            <p className="text-xs text-on-pastel/80 dark:text-muted-foreground">{sub}</p>
            {bar !== undefined && <ProgressBar pct={bar} className="mt-2" />}
          </div>
        ))}
      </div>

      <form method="GET" className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-ink bg-card p-3 shadow-cartoon">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Cari kode pesanan (#SIRA-…) atau nama" className="h-10 w-full rounded-full pl-9 pr-3 text-sm" />
        </div>
        <Button type="submit" size="sm">Cari</Button>
        {q && <Button asChild size="sm" variant="ghost"><Link href="/admin">Reset</Link></Button>}
      </form>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = orders.filter((o) => o.status === col.status);
          const Icon = col.icon;
          return (
            <section key={col.status} aria-label={col.title} className={cn("rounded-xl border-2 border-dashed p-3", col.wrap)}>
              <header className="mb-3 flex items-center justify-between gap-2 rounded-full border-2 border-ink bg-card px-3 py-1.5 shadow-cartoon">
                <span className="flex items-center gap-2 text-sm font-extrabold"><Icon className="h-4 w-4" />{col.title}</span>
                <Badge tone="plain">{items.length} JOBS</Badge>
              </header>
              <div className="space-y-3">
                {items.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Tidak ada pekerjaan.</p>}
                {items.map((o) => {
                  const job = one(o.print_jobs as { est_minutes: number | null; started_at: string | null; printers: unknown } | { est_minutes: number | null; started_at: string | null; printers: unknown }[] | null);
                  const printer = one(job?.printers as { name: string } | { name: string }[] | null);
                  const prog = printProgress(job?.started_at, job?.est_minutes);
                  return (
                    <article key={o.id} className="space-y-2.5 rounded-xl border-2 border-ink bg-card p-3 shadow-cartoon">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/admin/orders/${o.id}`} className="font-label text-xs font-bold text-primary hover:underline">#{o.order_code}</Link>
                          <p className="truncate text-sm font-extrabold">{o.customer_name}</p>
                        </div>
                        {isExpress(o.courier) && <Badge tone="butterStrong">EKSPRES 24H</Badge>}
                      </div>
                      <ul className="space-y-0.5 rounded-lg border-[1.5px] border-ink/30 bg-muted p-2 text-xs">
                        {(o.order_items as { product_name: string; quantity: number }[]).slice(0, 3).map((it, i) => (
                          <li key={i} className="truncate">{it.quantity}× {it.product_name}</li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between font-label text-[11px] font-bold text-muted-foreground">
                        <span>{formatRupiah(o.total)}</span><span>{formatDateTime(o.created_at)}</span>
                      </div>

                      {col.status === "paid" && (
                        <Button asChild size="sm" className="w-full"><Link href={`/admin/slicing?order=${o.id}`}>Buka Slicing</Link></Button>
                      )}
                      {col.status === "in_production" && (
                        <>
                          <p className="flex items-center justify-between font-label text-[11px] font-bold">
                            <span>{printer?.name ?? "Mesin —"}</span>
                            <span>{prog ? `${prog.pct}% · sisa ${formatMinutes(prog.remaining)}` : "—"}</span>
                          </p>
                          {prog && <ProgressBar pct={prog.pct} />}
                          <AdvanceButton orderId={o.id} to="qc_finishing" label="Selesai Cetak → QC" variant="secondary" />
                        </>
                      )}
                      {col.status === "qc_finishing" && (
                        <div className="grid gap-2">
                          <AdvanceButton orderId={o.id} to="packing" label="Konfirmasi Lolos QC" variant="secondary" />
                          <AdvanceButton orderId={o.id} to="in_production" label="Cetak Ulang" variant="outline" confirm="Kembalikan pesanan ke status Sedang Dicetak?" />
                        </div>
                      )}
                      {col.status === "packing" && (
                        <Button asChild size="sm" variant="butter" className="w-full"><Link href={`/admin/logistics?order=${o.id}`}>Atur Pengiriman</Link></Button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className="rounded-xl border-2 border-ink bg-card p-4 shadow-cartoon" aria-label="Armada printer">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-extrabold"><Cpu className="h-4 w-4" /> Armada Farm Grid ({printers.length} Unit)</h2>
          <Button asChild size="sm" variant="outline"><Link href="/admin/fleet">Kelola armada</Link></Button>
        </div>
        {printers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada printer. Tambahkan di Farm Fleet Live.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {printers.map((p) => (
              <li key={p.id} className={cn("rounded-xl border-[1.5px] border-ink p-2 text-on-pastel", PRINTER_TONE[p.status])}>
                <p className="flex items-center justify-between font-label text-[11px] font-bold"><span>{p.name}</span><span>{PRINTER_LABEL[p.status]}</span></p>
                <p className="truncate text-[11px]">{p.current_label ?? "—"}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
