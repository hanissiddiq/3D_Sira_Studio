"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Rocket } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useDict } from "@/components/layout/LanguageProvider";
import { computeTotals, type Tier } from "@/lib/pricing";
import { cn, formatRupiah } from "@/lib/utils";

interface Props { tiers: Tier[]; basePrice: number; productName: string; whatsapp?: string }

export function TierSimulator({ tiers, basePrice, productName, whatsapp }: Props) {
  const t = useDict().landing;
  const sorted = useMemo(() => [...tiers].sort((a, b) => a.min_quantity - b.min_quantity), [tiers]);
  const max = Math.max(50, (sorted.at(-1)?.min_quantity ?? 25) * 2);
  const [qty, setQty] = useState(Math.min(25, max));

  const item = { basePrice, textFee: 0, logoFee: 0, quantity: qty, customization: {} };
  const totals = computeTotals([item], tiers);
  const full = basePrice * qty;

  // Sel rentang: Normal (1..tier1-1), lalu tiap tier
  const cells = [
    { label: t.simNormal, range: `1 - ${(sorted[0]?.min_quantity ?? 2) - 1}`, active: totals.discountPercent === 0 },
    ...sorted.map((tier, i) => {
      const next = sorted[i + 1];
      return {
        label: `${tier.percent}%`,
        range: next ? `${tier.min_quantity} - ${next.min_quantity - 1}` : `≥ ${tier.min_quantity}`,
        active: totals.discountPercent === tier.percent,
      };
    }),
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid items-center gap-8 rounded-xl border-2 border-ink bg-gradient-to-br from-powder via-card to-peach-soft p-6 shadow-cartoon-lg md:p-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full border-2 border-ink bg-peach px-3 py-1 font-label text-xs font-bold text-on-pastel">🎁 {t.simBadge}</span>
            <span className="font-semibold">{t.simTags}</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{t.simTitle}</h2>
          <p className="text-muted-foreground">{t.simSub}</p>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "bg-[#25d366] text-on-pastel")}><MessageCircle />{t.simWa}</a>
          )}
        </div>

        <div className="rounded-xl border-2 border-ink bg-card p-5 shadow-cartoon">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="font-label text-xs font-bold">{t.simTitle2}</p>
            <span className="rounded-full border-2 border-ink bg-primary px-3 py-1 font-label text-xs font-bold text-white">
              {totals.discountPercent > 0 ? t.simSave(totals.discountPercent) : t.simSaveNone}
            </span>
          </div>
          <div className="flex items-baseline justify-between"><label htmlFor="sim-qty" className="font-semibold">{t.simQty}</label>
            <output className="font-label text-lg font-bold text-primary" htmlFor="sim-qty">{qty} pcs</output></div>
          <input id="sim-qty" type="range" min={1} max={max} value={qty} onChange={(e) => setQty(Number(e.target.value))}
            className="my-3 h-3 w-full cursor-pointer" aria-valuetext={`${qty} pcs`} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {cells.slice(0, 4).map((c) => (
              <div key={c.range} className={cn("rounded-xl border-2 p-2 text-center", c.active ? "border-ink bg-mint shadow-cartoon text-on-pastel" : "border-ink/20 bg-muted")}>
                <p className="font-label text-[10px] text-muted-foreground">{c.range} pcs</p>
                <p className="text-sm font-extrabold">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border-2 border-ink bg-butter-soft p-3 shadow-cartoon">
            <div>
              <p className="font-label text-[10px] font-bold text-muted-foreground">{t.simEstimate(productName)}</p>
              <p className="font-label text-lg font-bold">{formatRupiah(totals.total)}
                {totals.discount > 0 && <span className="ml-2 text-xs font-medium text-muted-foreground line-through">{formatRupiah(full)}</span>}</p>
            </div>
            <Link href="/product" className={cn(buttonVariants({ size: "sm" }))}>{t.simLock}<Rocket /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
