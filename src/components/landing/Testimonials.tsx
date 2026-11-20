import { Badge } from "@/components/ui/badge";
import { getLang } from "@/lib/i18n/server";
import { dictionaries, pick } from "@/lib/i18n/dictionaries";
import { SectionHead } from "./SectionHead";

interface Review {
  id: string; reviewer_name: string; rating: number; comment: string | null; products: unknown;
}
const AVATAR = ["bg-primary text-white", "bg-peach text-on-pastel", "bg-mint text-on-pastel"];
const initials = (n: string) => n.replace(/[^A-Za-z\s]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "•";

export async function Testimonials({ reviews, stats }: { reviews: Review[]; stats: { avg: number; count: number } | null }) {
  const lang = await getLang();
  const t = dictionaries[lang].landing;
  if (reviews.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <SectionHead eyebrow={`💖 ${t.revEyebrow}`} title={t.revTitle} />
        {stats && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-card px-4 py-2 shadow-cartoon">
            <span className="text-amber-500" aria-hidden>★★★★★</span>
            <span className="font-label text-sm font-bold">{stats.avg.toFixed(1)}/5</span>
            <span className="text-xs text-muted-foreground">{t.revHappy(stats.count)}</span>
          </div>
        )}
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {reviews.map((r, i) => {
          const p = (Array.isArray(r.products) ? r.products[0] : r.products) as { name_id: string; name_en: string } | null;
          return (
            <figure key={r.id} className="flex flex-col gap-4 rounded-xl border-2 border-ink bg-card p-5 shadow-cartoon">
              <div className="flex items-center justify-between">
                <span role="img" aria-label={`${r.rating}/5`} className="text-amber-500">{"★".repeat(r.rating)}<span className="text-muted-foreground/30">{"★".repeat(5 - r.rating)}</span></span>
                <Badge tone="mint">{t.revVerified}</Badge>
              </div>
              <blockquote className="whitespace-pre-line text-sm leading-relaxed">“{r.comment}”</blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t border-ink/15 pt-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink font-label text-xs font-bold ${AVATAR[i % 3]}`}>{initials(r.reviewer_name)}</span>
                <span className="min-w-0 text-sm">
                  <span className="block font-bold">{r.reviewer_name}</span>
                  {p && <span className="block truncate text-xs text-muted-foreground">{t.revBought(pick(lang, p.name_id, p.name_en))}</span>}
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
