import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHead({ eyebrow, title, sub, href, linkLabel }: {
  eyebrow?: string; title: string; sub?: string; href?: string; linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1.5">
        {eyebrow && <p className="font-label text-xs font-bold text-primary">{eyebrow}</p>}
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
        {sub && <p className="max-w-xl text-muted-foreground">{sub}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="inline-flex items-center gap-1 font-label text-sm font-bold text-primary hover:underline">{linkLabel}<ArrowRight className="h-4 w-4" /></Link>
      )}
    </div>
  );
}
