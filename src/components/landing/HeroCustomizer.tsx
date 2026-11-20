"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Shuffle, ShoppingCart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useDict } from "@/components/layout/LanguageProvider";
import { cn, formatRupiah } from "@/lib/utils";

const PALETTE = [
  { name: "Periwinkle Blue", hex: "#6c93f5" }, { name: "Peach Boba", hex: "#ffae85" },
  { name: "Sweet Mint", hex: "#65d4b0" }, { name: "Banana Milk", hex: "#fde38c" },
];
const NAMES = ["ALEXA 3D", "KENZO 3D", "MOCHI", "SIRA", "NAYA", "BIMA"];

// Pratinjau CSS 3D (bukan WebGL): miring mengikuti pointer. Kustomisasi penuh ada di /product/[slug].
export function HeroCustomizer({ href, basePrice, textFee }: { href: string; basePrice: number; textFee: number }) {
  const t = useDict().landing;
  const [name, setName] = useState("ALEXA 3D");
  const [color, setColor] = useState(PALETTE[0]);
  const [tilt, setTilt] = useState({ x: -8, y: 14 });
  const stage = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py * 28, y: px * 36 });
  };
  const shuffle = () => {
    setName(NAMES[Math.floor(Math.random() * NAMES.length)]);
    setColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
  };
  const price = basePrice + (name.trim() ? textFee : 0);

  return (
    <div className="rounded-xl border-2 border-ink bg-card p-5 shadow-cartoon-lg">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5" aria-hidden>
            <i className="h-3 w-3 rounded-full border border-ink bg-peach" /><i className="h-3 w-3 rounded-full border border-ink bg-mint" /><i className="h-3 w-3 rounded-full border border-ink bg-lilac" />
          </span>
          <span className="font-label text-[10px] font-bold text-muted-foreground">{t.demoTitle}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-mint px-2.5 py-0.5 font-label text-[10px] font-bold text-on-pastel">
          <span className="h-2 w-2 rounded-full bg-ink" /> {t.demoLive}
        </span>
      </div>

      <div ref={stage} onPointerMove={onMove} onPointerLeave={() => setTilt({ x: -8, y: 14 })}
        className="relative flex h-60 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-primary/60 bg-powder/60 [perspective:900px]"
        style={{ backgroundImage: "radial-gradient(rgba(108,147,245,.35) 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
        <span className="absolute left-3 top-3 rounded-full border-[1.5px] border-ink bg-card px-2 py-0.5 font-label text-[10px] font-bold">X 95.0mm</span>
        <span className="absolute bottom-3 right-3 rounded-full border-[1.5px] border-ink bg-card px-2 py-0.5 font-label text-[10px] font-bold">Z 8.4mm</span>
        <div className="relative flex h-28 w-56 items-center justify-center rounded-2xl border-[3px] border-ink shadow-cartoon-lg transition-transform duration-100"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, background: `linear-gradient(135deg, #fff 0%, ${color.hex} 140%)` }}>
          <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-[3px] border-ink bg-card" />
          <span className="max-w-[10rem] truncate font-label text-2xl font-bold tracking-wide text-on-pastel [text-shadow:2px_2px_0_rgba(255,255,255,.7)]">{name || " "}</span>
        </div>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-[1.5px] border-ink bg-card px-3 py-0.5 text-[10px] font-semibold">⟳ {t.demoRotate}</span>
        <div className="absolute bottom-3 left-3 hidden rounded-lg border-2 border-ink bg-card px-2.5 py-1 shadow-cartoon sm:block">
          <p className="font-label text-[9px] font-bold text-muted-foreground">{t.demoLayer}</p>
          <p className="font-label text-xs font-bold text-primary">{t.demoLayerVal}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <label htmlFor="hero-name" className="shrink-0 font-label text-xs font-bold">{t.demoName}</label>
        <input id="hero-name" value={name} maxLength={12} onChange={(e) => setName(e.target.value.toUpperCase())}
          className="h-10 min-w-0 flex-1 rounded-full bg-powder px-4 font-label text-sm font-bold" />
        <button type="button" onClick={shuffle} className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}><Shuffle />{t.demoShuffle}</button>
      </div>

      <p className="mt-4 font-label text-[11px] font-bold">{t.demoPalette}</p>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t.demoPalette}>
        {PALETTE.map((c) => (
          <button key={c.hex} type="button" role="radio" aria-checked={color.hex === c.hex} onClick={() => setColor(c)}
            className={cn("inline-flex items-center gap-2 rounded-full border-2 border-ink bg-card px-3 py-1.5 font-label text-xs font-bold shadow-cartoon transition active:translate-y-1 active:shadow-none",
              color.hex === c.hex && "bg-powder")}>
            <i className="h-3.5 w-3.5 rounded-full border-[1.5px] border-ink" style={{ background: c.hex }} />{c.name}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-dashed border-ink/25 pt-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{t.demoPrice}</p>
          <p className="font-label text-xl font-bold">{formatRupiah(price)}</p>
        </div>
        <Link href={href} className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}><ShoppingCart />{t.demoCheckout}</Link>
      </div>
    </div>
  );
}
