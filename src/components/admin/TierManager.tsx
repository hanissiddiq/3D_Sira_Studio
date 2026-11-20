"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteTierAction, saveTierAction } from "@/app/(dashboard)/admin/settings/actions";

export interface TierRow { id: string; min_quantity: number; percent: number }

function TierRowEditor({ tier }: { tier: TierRow }) {
  const router = useRouter();
  const [qty, setQty] = useState(tier.min_quantity);
  const [pct, setPct] = useState(Number(tier.percent));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => { const r = await fn(); if (r.ok) router.refresh(); else setError(r.error ?? "Gagal."); });
  };
  return (
    <div className="flex flex-wrap items-end gap-3 border-b-2 border-dashed border-ink/20 py-3 last:border-0">
      <div className="space-y-1.5"><Label>Min. pcs</Label><Input type="number" className="w-28" min={2} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></div>
      <div className="space-y-1.5"><Label>Diskon (%)</Label><Input type="number" className="w-28" min={0.01} max={100} step="0.01" value={pct} onChange={(e) => setPct(Number(e.target.value))} /></div>
      <Button size="sm" disabled={pending} onClick={() => run(() => saveTierAction(tier.id, { minQuantity: qty, percent: pct }))}>{pending && <Loader2 className="animate-spin" />}Simpan</Button>
      <Button size="sm" variant="destructive" disabled={pending} aria-label="Hapus tier"
        onClick={() => { if (window.confirm("Hapus tier diskon ini?")) run(() => deleteTierAction(tier.id)); }}><Trash2 /></Button>
      {error && <p role="alert" className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function TierManager({ tiers }: { tiers: TierRow[] }) {
  const router = useRouter();
  const [qty, setQty] = useState(10);
  const [pct, setPct] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const add = () => {
    setError(null);
    startTransition(async () => { const r = await saveTierAction(null, { minQuantity: qty, percent: pct }); if (r.ok) router.refresh(); else setError(r.error); });
  };
  return (
    <Card>
      <CardHeader><CardTitle>Tier diskon grosir</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Diterapkan otomatis di keranjang berdasarkan total kuantitas. Tier tertinggi yang terpenuhi yang berlaku. Juga dipakai di banner promo dan simulator beranda.</p>
        {tiers.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada tier.</p> : tiers.map((t) => <TierRowEditor key={`${t.id}-${t.min_quantity}-${t.percent}`} tier={t} />)}
        <div className="flex flex-wrap items-end gap-3 rounded-xl border-2 border-ink bg-mint-soft p-3 text-on-pastel">
          <div className="space-y-1.5"><Label>Min. pcs</Label><Input type="number" className="w-28" min={2} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Diskon (%)</Label><Input type="number" className="w-28" min={0.01} max={100} step="0.01" value={pct} onChange={(e) => setPct(Number(e.target.value))} /></div>
          <Button size="sm" variant="secondary" disabled={pending} onClick={add}>{pending && <Loader2 className="animate-spin" />}Tambah tier</Button>
          {error && <p role="alert" className="w-full text-xs text-red-600">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
