import { Search, Zap } from "lucide-react";
import { getBulkTiers, getFleetSummary } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";
import { BrandMark } from "./BrandMark";
import { CartButton } from "./CartButton";
import { LanguageToggle } from "./LanguageToggle";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export async function Navbar() {
  const [d, tiers, fleet] = await Promise.all([getDict(), getBulkTiers(), getFleetSummary()]);
  const t = d.nav;
  const links = [
    { href: "/", label: t.home }, { href: "/product", label: t.studio },
    { href: "/shop", label: t.readyStock }, { href: "/gallery", label: t.realPrint },
    { href: "/gifts", label: t.giftsBulk }, { href: "/orders", label: t.track },
  ];
  const promo = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity)[0];

  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <BrandMark />
        <nav className="hidden items-center gap-1 xl:flex" aria-label={t.main}><NavLinks links={links} /></nav>
        <div className="flex items-center gap-2">
          <form action="/product" method="get" role="search" className="relative hidden lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input name="q" type="search" maxLength={50} placeholder={t.search} aria-label={t.search}
              className="h-10 w-56 rounded-full border-2 bg-powder pl-9 pr-3 text-sm placeholder:text-muted-foreground" />
          </form>
          <span className="hidden items-center gap-1 rounded-full border-2 border-ink bg-mint px-3 py-1.5 font-label text-xs font-bold text-on-pastel shadow-cartoon md:inline-flex">
            <Zap className="h-3.5 w-3.5" /> {t.fastPrint}
          </span>
          <LanguageToggle /><ThemeToggle /><CartButton />
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-ink/20 px-4 py-2 xl:hidden" aria-label={t.main}>
        <NavLinks links={links} />
      </nav>

      {(promo || fleet) && (
        <div className="border-t border-ink/20 bg-powder/60">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs">
            {promo && (
              <>
                <span className="rounded-full border-2 border-ink bg-peach px-2.5 py-0.5 font-label font-bold text-on-pastel">🍬 {d.landing.promoBadge}</span>
                <span className="font-semibold">{d.landing.promoText(promo.percent, promo.min_quantity)}</span>
              </>
            )}
            {fleet && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-card px-2.5 py-0.5 font-label font-bold">
                <span className="h-2 w-2 rounded-full bg-secondary" /> {d.landing.machines(fleet.online)}
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
