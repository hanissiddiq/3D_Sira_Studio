"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dispatchOrderAction } from "@/app/(dashboard)/admin/logistics/actions";

export function DispatchForm({ orderId, tracking, weightGrams, box }: {
  orderId: string; tracking: string | null; weightGrams: number | null; box: string | null;
}) {
  const router = useRouter();
  const [trk, setTrk] = useState(tracking ?? "");
  const [weight, setWeight] = useState(weightGrams ?? 0);
  const [boxSize, setBoxSize] = useState(box ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    startTransition(async () => {
      const r = await dispatchOrderAction({ orderId, tracking: trk, weightGrams: Math.floor(weight), box: boxSize });
      if (r.ok) router.refresh(); else setError(r.error);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border-2 border-ink bg-muted p-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-3"><Label htmlFor={`trk-${orderId}`}>No. resi kurir</Label>
          <Input id={`trk-${orderId}`} value={trk} maxLength={60} placeholder="JNE-9082348911" className="font-label font-bold" onChange={(e) => setTrk(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor={`w-${orderId}`}>Berat (gram)</Label>
          <Input id={`w-${orderId}`} type="number" min={1} value={weight || ""} onChange={(e) => setWeight(Number(e.target.value))} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor={`b-${orderId}`}>Dimensi box</Label>
          <Input id={`b-${orderId}`} value={boxSize} maxLength={40} placeholder="20 × 15 × 10 cm" onChange={(e) => setBoxSize(e.target.value)} /></div>
      </div>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <Button type="submit" size="sm" variant="butter" className="w-full" disabled={pending || !trk.trim() || weight < 1}>
        {pending ? <Loader2 className="animate-spin" /> : <Truck />}Serahkan ke kurir
      </Button>
    </form>
  );
}
