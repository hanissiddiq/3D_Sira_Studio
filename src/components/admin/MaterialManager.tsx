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
import { formatRupiah } from "@/lib/utils";
import { createMaterialAction, deleteMaterialAction, updateMaterialAction } from "@/app/(dashboard)/admin/materials/actions";

export interface MaterialRow {
  id: string; name: string; type: string; color_name: string; color_hex: string;
  stock_rolls: number; grams_per_roll: number; low_stock_rolls: number; cost_per_kg: number;
}

const EMPTY = { name: "", type: "PLA", colorName: "", colorHex: "#6c93f5", stockRolls: 0, gramsPerRoll: 1000, lowStockRolls: 2, costPerKg: 0 };
type Form = typeof EMPTY;

function Fields({ v, set }: { v: Form; set: (f: Form) => void }) {
  const num = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => set({ ...v, [k]: Number(e.target.value) });
  const txt = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => set({ ...v, [k]: e.target.value });
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5"><Label>Nama</Label><Input value={v.name} maxLength={80} onChange={txt("name")} placeholder="Bambu PLA Matte" /></div>
      <div className="space-y-1.5"><Label>Tipe</Label><Input value={v.type} maxLength={30} onChange={txt("type")} placeholder="PLA+" /></div>
      <div className="space-y-1.5"><Label>Nama warna</Label><Input value={v.colorName} maxLength={40} onChange={txt("colorName")} placeholder="Slate Grey" /></div>
      <div className="space-y-1.5"><Label>Warna</Label><Input type="color" className="h-10 w-20 p-1" value={v.colorHex} onChange={txt("colorHex")} /></div>
      <div className="space-y-1.5"><Label>Stok (roll)</Label><Input type="number" min={0} step="0.1" value={v.stockRolls} onChange={num("stockRolls")} /></div>
      <div className="space-y-1.5"><Label>Gram / roll</Label><Input type="number" min={1} value={v.gramsPerRoll} onChange={num("gramsPerRoll")} /></div>
      <div className="space-y-1.5"><Label>Batas menipis (roll)</Label><Input type="number" min={0} step="0.1" value={v.lowStockRolls} onChange={num("lowStockRolls")} /></div>
      <div className="space-y-1.5"><Label>Biaya / kg (Rp)</Label><Input type="number" min={0} value={v.costPerKg} onChange={num("costPerKg")} /></div>
    </div>
  );
}

function MaterialCard({ m, canDelete }: { m: MaterialRow; canDelete: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState<Form>({ name: m.name, type: m.type, colorName: m.color_name, colorHex: m.color_hex,
    stockRolls: Number(m.stock_rolls), gramsPerRoll: m.grams_per_roll, lowStockRolls: Number(m.low_stock_rolls), costPerKg: m.cost_per_kg });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const low = Number(m.stock_rolls) <= Number(m.low_stock_rolls);
  const pct = Math.min(100, Math.round((Number(m.stock_rolls) / Math.max(1, Number(m.low_stock_rolls) * 3)) * 100));

  const save = () => startTransition(async () => {
    const r = await updateMaterialAction(m.id, v);
    if (r.ok) { setEditing(false); router.refresh(); } else setError(r.error);
  });
  const del = () => {
    if (!window.confirm(`Hapus material ${m.name}?`)) return;
    startTransition(async () => { const r = await deleteMaterialAction(m.id); if (r.ok) router.refresh(); else setError(r.error); });
  };

  return (
    <div className="space-y-3 rounded-xl border-2 border-ink bg-card p-4 shadow-cartoon">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full border-2 border-ink" style={{ background: m.color_hex }} aria-hidden />
          <div><p className="text-sm font-extrabold leading-tight">{m.name}</p><p className="text-xs text-muted-foreground">{m.type}{m.color_name && ` · ${m.color_name}`}</p></div>
        </div>
        <Badge tone={low ? "peachStrong" : "mint"}>{low ? "Menipis" : "Aman"}</Badge>
      </div>
      <div>
        <p className="font-label text-sm font-bold">{Number(m.stock_rolls).toFixed(2)} roll <span className="text-xs font-medium text-muted-foreground">≈ {((Number(m.stock_rolls) * m.grams_per_roll) / 1000).toFixed(2)} kg</span></p>
        <ProgressBar pct={pct} tone={low ? "peach" : "mint"} className="mt-1" />
        <p className="mt-1 text-xs text-muted-foreground">{formatRupiah(m.cost_per_kg)}/kg</p>
      </div>
      {editing ? (
        <div className="space-y-3">
          <Fields v={v} set={setV} />
          <div className="flex gap-2"><Button size="sm" onClick={save} disabled={pending}>{pending && <Loader2 className="animate-spin" />}Simpan</Button><Button size="sm" variant="outline" onClick={() => setEditing(false)}>Batal</Button></div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Ubah</Button>
          {canDelete && <Button size="sm" variant="destructive" disabled={pending} onClick={del} aria-label={`Hapus ${m.name}`}><Trash2 /></Button>}
        </div>
      )}
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function MaterialManager({ materials, canDelete }: { materials: MaterialRow[]; canDelete: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<Form>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const add = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    startTransition(async () => {
      const r = await createMaterialAction(v);
      if (!r.ok) return setError(r.error);
      setV(EMPTY); router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Tambah material</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="space-y-4">
            <Fields v={v} set={setV} />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={pending || !v.name.trim()}>{pending && <Loader2 className="animate-spin" />}Simpan material</Button>
          </form>
        </CardContent>
      </Card>
      {materials.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Belum ada material.</p> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{materials.map((m) => <MaterialCard key={m.id} m={m} canDelete={canDelete} />)}</div>
      )}
    </div>
  );
}
