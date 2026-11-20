"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatRupiah } from "@/lib/utils";
import { formatMinutes } from "@/lib/workshop";
import { startPrintJobAction } from "@/app/(dashboard)/admin/slicing/actions";

export interface PrinterOption { id: string; name: string; model: string; nozzle: string }
export interface MaterialOption { id: string; name: string; type: string; color_name: string; color_hex: string; stock_rolls: number; grams_per_roll: number; cost_per_kg: number }

const LAYERS = [0.08, 0.12, 0.16, 0.2, 0.28];
const CHECKS = [
  { key: "dimensions", label: "Dimensi sesuai pesanan", hint: "Ukuran objek dan toleransi sudah dicek." },
  { key: "design", label: "Teks / logo terbaca jelas", hint: "Ketebalan huruf & detail cukup untuk nozzle terpilih." },
  { key: "color", label: "Warna sesuai kustomisasi", hint: "Filamen terpilih cocok dengan pilihan pelanggan." },
  { key: "support", label: "Orientasi & support aman", hint: "Overhang ditangani, bed adhesion cukup." },
] as const;

export function SlicingWorkspace({ orderId, orderCode, printers, materials }: {
  orderId: string; orderCode: string; printers: PrinterOption[]; materials: MaterialOption[];
}) {
  const router = useRouter();
  const [printerId, setPrinterId] = useState(printers[0]?.id ?? "");
  const [materialId, setMaterialId] = useState<string>(materials[0]?.id ?? "");
  const [layer, setLayer] = useState(0.12);
  const [infill, setInfill] = useState(25);
  const [hours, setHours] = useState(1);
  const [mins, setMins] = useState(0);
  const [grams, setGrams] = useState(20);
  const [notes, setNotes] = useState("");
  const [checks, setChecks] = useState({ dimensions: false, design: false, color: false, support: false });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const material = materials.find((m) => m.id === materialId);
  const printer = printers.find((p) => p.id === printerId);
  const estMinutes = Math.max(0, Math.floor(hours) * 60 + Math.floor(mins));
  const cost = material ? Math.round((grams * material.cost_per_kg) / 1000) : 0;
  const passed = useMemo(() => Object.values(checks).every(Boolean), [checks]);
  const ready = passed && !!printer && estMinutes > 0 && grams > 0;

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await startPrintJobAction({
        orderId, printerId, materialId: materialId || null, layerHeight: layer, infill,
        estMinutes, estGrams: Math.floor(grams), notes,
        preflight: checks as { dimensions: true; design: true; color: true; support: true },
      });
      if (res.ok) router.push("/admin"); else setError(res.error);
    });
  };

  const select = "flex h-10 w-full px-3 text-sm";
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Pra-cetak (Pre-Flight)</CardTitle>
            <Badge tone={passed ? "mintStrong" : "butter"}>{passed ? "PASSED ✨" : "BELUM LENGKAP"}</Badge>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {CHECKS.map((c) => (
              <label key={c.key} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border-2 border-ink p-3 transition", checks[c.key] ? "bg-mint-soft text-on-pastel" : "bg-card")}>
                <input type="checkbox" className="mt-0.5" checked={checks[c.key]} onChange={(e) => setChecks({ ...checks, [c.key]: e.target.checked })} />
                <span><span className="block text-sm font-bold">{c.label}</span><span className="text-xs text-muted-foreground">{c.hint}</span></span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Catatan operator</CardTitle></CardHeader>
          <CardContent>
            <textarea rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mis. orientasi, brim, jeda warna…"
              className="flex w-full px-3 py-2 text-sm" />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Parameter cetak</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="material">Filamen</Label>
              <select id="material" value={materialId} onChange={(e) => setMaterialId(e.target.value)} className={select}>
                <option value="">Tanpa pengurangan stok</option>
                {materials.map((m) => <option key={m.id} value={m.id}>{m.name} {m.color_name && `· ${m.color_name}`} ({Number(m.stock_rolls).toFixed(1)} roll)</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="layer">Layer height</Label>
                <select id="layer" value={layer} onChange={(e) => setLayer(Number(e.target.value))} className={select}>
                  {LAYERS.map((l) => <option key={l} value={l}>{l.toFixed(2)} mm</option>)}
                </select></div>
              <div className="space-y-1.5"><Label htmlFor="infill">Infill (%)</Label>
                <Input id="infill" type="number" min={0} max={100} value={infill} onChange={(e) => setInfill(Number(e.target.value))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Estimasi durasi</Label>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} className="w-20" aria-label="Jam" value={hours} onChange={(e) => setHours(Number(e.target.value))} /><span className="text-sm">jam</span>
                <Input type="number" min={0} max={59} className="w-20" aria-label="Menit" value={mins} onChange={(e) => setMins(Number(e.target.value))} /><span className="text-sm">menit</span>
              </div></div>
            <div className="space-y-1.5"><Label htmlFor="grams">Estimasi filamen (gram)</Label>
              <Input id="grams" type="number" min={1} value={grams} onChange={(e) => setGrams(Number(e.target.value))} /></div>
          </CardContent>
        </Card>

        <div className="space-y-2 rounded-xl border-2 border-ink bg-butter-soft p-4 text-on-pastel shadow-cartoon">
          <p className="font-label text-xs font-bold">DURASI CETAK EST.</p>
          <p className="text-2xl font-extrabold">{estMinutes > 0 ? formatMinutes(estMinutes) : "—"}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="font-label font-bold text-on-pastel/70">TOTAL FILAMEN</p><p className="font-bold">{grams} g</p></div>
            <div><p className="font-label font-bold text-on-pastel/70">BIAYA BAHAN</p><p className="font-bold">{formatRupiah(cost)}</p></div>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Printer</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {printers.length === 0 ? (
              <p className="text-sm text-red-600">Tidak ada printer berstatus idle. Kosongkan bed / tambah printer di Farm Fleet Live.</p>
            ) : (
              <select value={printerId} onChange={(e) => setPrinterId(e.target.value)} className={select} aria-label="Printer">
                {printers.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.model || "—"} · {p.nozzle}</option>)}
              </select>
            )}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" size="lg" disabled={!ready || pending} onClick={submit}>
              {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Mulai cetak {printer ? `di ${printer.name}` : ""}
            </Button>
            <p className="text-xs text-muted-foreground">Order #{orderCode} pindah ke “Sedang Dicetak”, printer ditandai mencetak, dan stok filamen dikurangi sesuai estimasi.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
