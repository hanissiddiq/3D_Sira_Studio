import { getApprovedReviews } from "@/lib/data";
import { getLang } from "@/lib/i18n/server";
import { dictionaries } from "@/lib/i18n/dictionaries";

function Stars({ n, label }: { n: number; label: string }) {
  return <span role="img" aria-label={label} className="text-amber-500">{"★".repeat(n)}<span className="text-muted-foreground/40">{"★".repeat(5 - n)}</span></span>;
}

export async function ProductReviews({ productId }: { productId: string }) {
  const lang = await getLang();
  const t = dictionaries[lang].reviews;
  const reviews = await getApprovedReviews(productId);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section className="space-y-4" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 id="reviews-title" className="text-xl font-semibold">{t.title}</h2>
        {reviews.length > 0 && <span className="text-sm text-muted-foreground">{t.average(avg.toFixed(1), reviews.length)}</span>}
      </div>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.none}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg border p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.reviewer_name}</span>
                <Stars n={r.rating} label={t.star(r.rating)} />
              </div>
              {r.comment && <p className="mt-2 whitespace-pre-line text-muted-foreground">{r.comment}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString(lang === "en" ? "en-US" : "id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium" })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
