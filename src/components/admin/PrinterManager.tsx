"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressBar } from "@/components/admin/ProgressBar";
import { formatMinutes } from "@/lib/workshop";
import { createPrinterAction, deletePrinterAction, setPrinterStatusAction } from "@/app/(dashboard)/admin/fleet/actions";

export interface PrinterRow {
  id: string; name: string; model: string; nozzle: string; status: string;
  current_label: string | null; progress: { pct: number; remaining: number } | null;
}

const TONE: Record<string, "mint" | "sky" | "peach" | "butter" | "plain"> = {
  idle: "mint", printing: "sky", eject: "peach", maintenance: "butter", offline: "plain",
};
const LABEL: Record<string, string> = { idle: "Idle", printing: "Mencetak", eject: "Eject bed", maintenance: "Servis", offline: "Offline" };

function PrinterCard({ p, canDelete }: { p: PrinterRow; canDelete: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => { const r = await fn(); if (r.ok) router.refresh(); else setError(r.error ?? "Gagal."); });
  };
  return (
    <div className="space-y-3 rounded-xl border-2 border-ink bg-card p-4 shadow-cartoon">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-label text-sm font-bold">{p.name}</p>
          <p className="text-xs text-muted-foreground">{p.model || "—"} · nozzle {p.nozzle}</p>
        </div>
        <Badge tone={TONE[p.status] ?? "plain"}>{LABEL[p.status] ?? p.status}</Badge>
      </div>
      {p.current_label && <p className="font-label text-xs font-bold">Job: #{p.current_label}</p>}
      {p.status === "printing" && p.progress && (
        <div className="space-y-1">
          <ProgressBar pct={p.progress.pct} />
          <p className="font-label text-[11px] text-muted-foreground">{p.progress.pct}% · sisa ± {formatMinutes(p.progress.remaining)} (estimasi)</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {p.status === "eject" && <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setPrinterStatusAction(p.id, "idle"))}>Bed dikosongkan</Button>}
        {(p.status === "idle" || p.status === "offline") && p.status !== "idle" && <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setPrinterStatusAction(p.id, "idle"))}>Online</Button>}
        {p.status === "maintenance" && <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setPrinterStatusAction(p.id, "idle"))}>Selesai servis</Button>}
        {p.status === "idle" && (
          <>
            <Button size="sm" variant="butter" disabled={pending} onClick={() => run(() => setPrinterStatusAction(p.id, "maintenance"))}>Servis</Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setPrinterStatusAction(p.id, "offline"))}>Offline</Button>
          </>
        )}
        {canDelete && (
          <Button size="sm" variant="destructive" disabled={pending} aria-label={`Hapus ${p.name}`}
            onClick={() => { if (window.confirm(`Hapus printer ${p.name}?`)) run(() => deletePrinterAction(p.id)); }}><Trash2 /></Button>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function PrinterManager({ printers, canDelete }: { printers: PrinterRow[]; canDelete: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(""); const [model, setModel] = useState(""); const [nozzle, setNozzle] = useState("0.4mm");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const add = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    startTransition(async () => {
      const r = await createPrinterAction({ name, model, nozzle });
      if (!r.ok) return setError(r.error);
      setName(""); setModel(""); router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Tambah printer</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-4 sm:grid-cols-[1fr_1fr_8rem_auto] sm:items-end">
            <div className="space-y-1.5"><Label htmlFor="p-name">Nama / kode</Label><Input id="p-name" value={name} maxLength={40} placeholder="X1C-01" onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="p-model">Model</Label><Input id="p-model" value={model} maxLength={80} placeholder="Bambu Lab X1-Carbon" onChange={(e) => setModel(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="p-nozzle">Nozzle</Label><Input id="p-nozzle" value={nozzle} maxLength={20} onChange={(e) => setNozzle(e.target.value)} /></div>
            <Button type="submit" disabled={pending || !name.trim()}>{pending && <Loader2 className="animate-spin" />}Tambah</Button>
          </form>
          {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
      {printers.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Belum ada printer.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{printers.map((p) => <PrinterCard key={p.id} p={p} canDelete={canDelete} />)}</div>
      )}
    </div>
  );
}
