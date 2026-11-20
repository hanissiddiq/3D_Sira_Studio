import Link from "next/link";
import { ShoppingBag, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatRupiah } from "@/lib/utils";

interface Props {
  variant: "custom" | "ready";
  href: string; name: string; description?: string; price: number; image?: string;
  badge?: string; fromLabel: string; cta: string;
  stockLabel?: string; soldOut?: boolean; soldOutLabel?: string;
}

export function ProductCard({ variant, href, name, description, price, image, badge, fromLabel, cta, stockLabel, soldOut, soldOutLabel }: Props) {
  const custom = variant === "custom";
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border-[1.5px] border-ink bg-card shadow-cartoon">
      <Link href={href} className={cn("relative block overflow-hidden border-b-[1.5px] border-ink bg-powder", custom ? "aspect-[16/10]" : "m-3 mb-0 aspect-[4/3] rounded-lg border-[1.5px]")}>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} loading="lazy" className="h-full w-full object-cover transition duration-300 hover:scale-105" />
        )}
        {custom && badge && <Badge tone="plain" className="absolute left-3 top-3 normal-case tracking-normal">{badge}</Badge>}
        {!custom && stockLabel && <Badge tone="powder" className="absolute bottom-2 left-2 normal-case tracking-normal" >{stockLabel}</Badge>}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-bold leading-snug"><Link href={href} className="hover:underline">{name}</Link></h3>
        {description && <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-ink/15 pt-3">
          <div className="leading-tight">
            {custom && <p className="font-label text-[11px] font-bold text-muted-foreground">{fromLabel}</p>}
            <p className={cn("font-label font-bold", custom ? "text-base text-foreground" : "text-sm text-secondary-foreground dark:text-foreground")}>{formatRupiah(price)}</p>
          </div>
          {soldOut ? (
            <span className="rounded-full border-2 border-ink bg-muted px-3 py-1.5 font-label text-xs font-bold text-muted-foreground">{soldOutLabel}</span>
          ) : (
            <Link href={href} className={cn(buttonVariants({ variant: custom ? "secondary" : "default", size: "sm" }))}>
              {custom ? <SlidersHorizontal /> : <ShoppingBag />}{cta}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
