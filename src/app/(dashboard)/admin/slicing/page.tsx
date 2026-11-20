import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { SlicingWorkspace } from "@/components/admin/SlicingWorkspace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/order-status";
import { cn, formatRupiah } from "@/lib/utils";
import { isExpress } from "@/lib/workshop";

export const metadata: Metadata = { title: "Slicing & Validasi" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
interface Cust { primaryColor?: string; secondaryColor?: string; text?: string; font?: string; logoPath?: string; snapshotPath?: string }

export default async function SlicingPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  await requirePermission("workshop:manage");
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: queue, error } = await supabase.from("orders")
    .select("id, order_code, customer_name, total, courier, created_at")
    .eq("status", "paid").order("created_at", { ascending: true });
  if (error) { console.error("slicing queue:", error); return <p className="text-sm text-red-600">Gagal memuat antrean.</p>; }

  const selectedId = sp.order && UUID_RE.test(sp.order) && queue.some((o) => o.id === sp.order) ? sp.order : queue[0]?.id;
  const selected = queue.find((o) => o.id === selectedId);

  let items: { id: string; product_name: string; quantity: number; customization: Cust; snapshotUrl: string | null; logoUrl: string | null }[] = [];
  let printers: { id: string; name: string; model: string; nozzle: string }[] = [];
  let materials: { id: string; name: string; type: string; color_name: string; color_hex: string; stock_rolls: number; grams_per_roll: number; cost_per_kg: number }[] = [];

  if (selected) {
    const [itemsRes, printersRes, materialsRes] = await Promise.all([
      supabase.from("order_items").select("id, product_name, quantity, customization").eq("order_id", selected.id),
      supabase.from("printers").select("id, name, model, nozzle").eq("status", "idle").order("name"),
      supabase.from("materials").select("id, name, type, color_name, color_hex, stock_rolls, grams_per_roll, cost_per_kg").gt("stock_rolls", 0).order("name"),
    ]);
    printers = printersRes.data ?? [];
    materials = materialsRes.data ?? [];
    const signed = async (bucket: string, path?: string) =>
      path ? (await supabase.storage.from(bucket).createSignedUrl(path, 300)).data?.signedUrl ?? null : null;
    items = await Promise.all((itemsRes.data ?? []).map(async (it) => ({
      ...it,
      snapshotUrl: await signed("design-snapshots", it.customization?.snapshotPath),
      logoUrl: await signed("customer-uploads", it.customization?.logoPath),
    })));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-label text-xs font-bold text-muted-foreground">Workshop › Antrean › Slicing</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Slicing & Validasi</h1>
        <p className="text-sm text-muted-foreground">Validasi desain pelanggan, isi parameter hasil slicing, pilih printer, lalu mulai cetak.</p>
      </div>

      {queue.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <ClipboardCheck className="mx-auto mb-3 h-8 w-8" />Tidak ada pesanan yang menunggu validasi. 🎉
        </CardContent></Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <nav aria-label="Antrean validasi" className="space-y-2">
            {queue.map((o) => (
              <Link key={o.id} href={`/admin/slicing?order=${o.id}`} aria-current={o.id === selectedId ? "page" : undefined}
                className={cn("block rounded-xl border-2 border-ink p-3 shadow-cartoon transition", o.id === selectedId ? "bg-powder" : "bg-card hover:bg-muted")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label text-xs font-bold text-primary">#{o.order_code}</span>
                  {isExpress(o.courier) && <Badge tone="butterStrong">EKSPRES</Badge>}
                </div>
                <p className="truncate text-sm font-extrabold">{o.customer_name}</p>
                <p className="font-label text-[11px] text-muted-foreground">{formatRupiah(o.total)} · {formatDateTime(o.created_at)}</p>
              </Link>
            ))}
          </nav>

          {selected && (
            <div className="min-w-0 space-y-5">
              <Card>
                <CardHeader><CardTitle>Spesifikasi pesanan #{selected.order_code}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {items.map((it) => (
                    <div key={it.id} className="flex flex-col gap-3 border-b-2 border-dashed border-ink/20 pb-4 last:border-0 last:pb-0 sm:flex-row">
                      {it.snapshotUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.snapshotUrl} alt={`Desain ${it.product_name}`} className="h-36 w-36 shrink-0 rounded-xl border-2 border-ink object-cover" />
                      )}
                      <div className="space-y-1.5 text-sm">
                        <p className="font-extrabold">{it.quantity}× {it.product_name}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {it.customization?.primaryColor && <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-ink bg-card px-2 py-0.5 font-label font-bold"><i className="h-3 w-3 rounded-full border border-ink" style={{ background: it.customization.primaryColor }} />{it.customization.primaryColor}</span>}
                          {it.customization?.secondaryColor && <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-ink bg-card px-2 py-0.5 font-label font-bold"><i className="h-3 w-3 rounded-full border border-ink" style={{ background: it.customization.secondaryColor }} />{it.customization.secondaryColor}</span>}
                          {it.customization?.text && <span className="rounded-full border-[1.5px] border-ink bg-butter-soft px-2 py-0.5 font-label font-bold text-on-pastel">“{it.customization.text}” · {it.customization.font}</span>}
                          {it.logoUrl && <a href={it.logoUrl} target="_blank" rel="noreferrer" className="font-bold text-primary underline">Lihat logo</a>}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <SlicingWorkspace key={selected.id} orderId={selected.id} orderCode={selected.order_code} printers={printers} materials={materials} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
