import Link from "next/link";
import { ArrowRight, Gift, Star, Clock, ShieldCheck, QrCode, Cpu, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getDict } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { HeroCustomizer } from "./HeroCustomizer";

interface Props { stats: { avg: number; count: number } | null; demo: { href: string; basePrice: number; textFee: number } }

export async function Hero({ stats, demo }: Props) {
  const t = (await getDict()).landing;
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-16">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-card px-3 py-1.5 font-label text-xs font-bold text-primary shadow-cartoon"><Cpu className="h-3.5 w-3.5" />{t.chipPrecision}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-peach-soft px-3 py-1.5 font-label text-xs font-bold text-on-pastel shadow-cartoon dark:text-foreground"><Zap className="h-3.5 w-3.5" />{t.chipFast}</span>
        </div>
        <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">
          {t.heroA} <span className="text-primary">{t.heroB}</span> {t.heroC} 🌈
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">{t.heroSub}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/product" className={cn(buttonVariants({ size: "lg" }))}>{t.ctaStudio}<ArrowRight /></Link>
          <Link href="/shop" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}><Gift />{t.ctaReady}</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
          {[
            stats && { icon: Star, big: `${stats.avg.toFixed(1)}/5`, small: t.statReviews(stats.count), tint: "text-amber-500" },
            { icon: Clock, big: t.statLeadVal, small: t.statLead, tint: "text-primary" },
            { icon: ShieldCheck, big: t.statWarrantyVal, small: t.statWarranty, tint: "text-secondary" },
            { icon: QrCode, big: t.statInstantVal, small: t.statInstant, tint: "text-accent" },
          ].filter(Boolean).map((s) => {
            const { icon: Icon, big, small, tint } = s as { icon: typeof Star; big: string; small: string; tint: string };
            return (
              <div key={small} className="rounded-xl border-[1.5px] border-ink bg-card p-3 shadow-cartoon">
                <p className="flex items-center gap-1.5 font-label text-sm font-bold"><Icon className={cn("h-4 w-4", tint)} />{big}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{small}</p>
              </div>
            );
          })}
        </div>
      </div>
      <HeroCustomizer {...demo} />
    </section>
  );
}
