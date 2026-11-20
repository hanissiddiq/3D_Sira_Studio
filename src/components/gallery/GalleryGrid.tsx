"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDict } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";

export interface GalleryEntry { id: string; title: string; imageUrl: string; href: string | null; category: string | null }

export function GalleryGrid({ items, showFilters = true }: { items: GalleryEntry[]; showFilters?: boolean }) {
  const t = useDict().gallery;
  const l = useDict().landing;
  const [filter, setFilter] = useState<string | null>(null);
  const [index, setIndex] = useState<number | null>(null);

  const categories = useMemo(() => [...new Set(items.map((i) => i.category).filter((c): c is string => !!c))], [items]);
  const visible = useMemo(() => (filter ? items.filter((i) => i.category === filter) : items), [items, filter]);

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + visible.length) % visible.length)), [visible.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [index, close, step]);

  const current = index === null ? null : visible[index];

  return (
    <>
      {showFilters && categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter">
          {[null, ...categories].map((c) => (
            <button key={c ?? "all"} type="button" onClick={() => { setFilter(c); setIndex(null); }} aria-pressed={filter === c}
              className={cn("rounded-full border-2 px-4 py-1.5 font-label text-xs font-bold uppercase transition",
                filter === c ? "border-ink bg-primary text-white shadow-cartoon" : "border-ink/30 bg-card hover:border-ink")}>
              {c ?? l.galAll(items.length)}
            </button>
          ))}
        </div>
      )}

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {visible.map((it, i) => (
          <li key={it.id}>
            <button type="button" onClick={() => setIndex(i)}
              className="group relative block aspect-[3/4] w-full overflow-hidden rounded-xl border-[1.5px] border-ink bg-powder shadow-cartoon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.imageUrl} alt={it.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-left text-white">
                {it.category && <span className="flex items-center gap-1 font-label text-[10px] font-bold text-secondary"><Camera className="h-3 w-3" />{it.category}</span>}
                <span className="block text-sm font-bold leading-tight">{it.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={current.title}>
          <div className="absolute inset-0" onClick={close} />
          <div className="relative z-10 flex max-h-full max-w-4xl flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.imageUrl} alt={current.title} className="max-h-[75vh] rounded-xl border-2 border-ink object-contain" />
            <p className="text-center text-sm font-bold text-white">{current.title}</p>
            {current.href && (
              <Button asChild size="sm" variant="secondary" onClick={close}><Link href={current.href}>{t.orderSimilar}</Link></Button>
            )}
          </div>
          <Button variant="outline" size="icon" className="absolute right-3 top-3 z-20" onClick={close} aria-label={t.close}><X className="h-5 w-5" /></Button>
          {visible.length > 1 && (
            <>
              <Button variant="outline" size="icon" className="absolute left-3 top-1/2 z-20 -translate-y-1/2" onClick={() => step(-1)} aria-label={t.prev}><ChevronLeft className="h-6 w-6" /></Button>
              <Button variant="outline" size="icon" className="absolute right-3 top-1/2 z-20 -translate-y-1/2" onClick={() => step(1)} aria-label={t.next}><ChevronRight className="h-6 w-6" /></Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
