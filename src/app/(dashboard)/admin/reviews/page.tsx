import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewActions } from "@/components/reviews/ReviewActions";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ulasan" };

const PAGE_SIZE = 20;
const TABS = [
  { key: "pending", label: "Menunggu" }, { key: "approved", label: "Disetujui" },
  { key: "rejected", label: "Ditolak" }, { key: "all", label: "Semua" },
] as const;
const STATUS_LABEL: Record<string, string> = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };
const STATUS_CLASS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800",
};

// Relasi embed bisa berupa objek atau array: ambil elemen pertama bila array
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const user = await requirePermission("reviews:moderate");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.status)?.key ?? "pending";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  let query = supabase.from("reviews")
    .select("id, reviewer_name, rating, comment, status, created_at, products ( name_id ), order_items ( orders ( order_code ) )", { count: "exact" })
    .order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  if (tab !== "all") query = query.eq("status", tab);

  const { data: reviews, count, error } = await query;
  if (error) {
    console.error("admin reviews:", error);
    return <p className="text-sm text-red-600">Gagal memuat ulasan.</p>;
  }
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (t: string, p = 1) => `/admin/reviews?status=${t}${p > 1 ? `&page=${p}` : ""}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Ulasan</h1>
      <nav className="flex flex-wrap gap-2" aria-label="Filter status ulasan">
        {TABS.map((t) => (
          <Link key={t.key} href={href(t.key)} aria-current={tab === t.key ? "page" : undefined}
            className={cn("rounded-full border px-3 py-1 text-sm", tab === t.key ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
            {t.label}
          </Link>
        ))}
      </nav>

      <Card>
        <CardContent className="divide-y pt-6">
          {reviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada ulasan.</p>
          ) : reviews.map((r) => {
            const product = one(r.products as { name_id: string } | { name_id: string }[] | null);
            const item = one(r.order_items as { orders: unknown } | { orders: unknown }[] | null);
            const order = one(item?.orders as { order_code: string } | { order_code: string }[] | null);
            return (
              <article key={r.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:justify-between">
                <div className="min-w-0 space-y-1 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span role="img" aria-label={`${r.rating} bintang`} className="text-amber-500">
                      {"★".repeat(r.rating)}<span className="text-muted-foreground/40">{"★".repeat(5 - r.rating)}</span>
                    </span>
                    <span className="font-medium">{r.reviewer_name}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_CLASS[r.status])}>{STATUS_LABEL[r.status] ?? r.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product?.name_id ?? "—"}{order ? ` · ${order.order_code}` : ""} · {formatDateTime(r.created_at)}
                  </p>
                  {r.comment ? <p className="whitespace-pre-line">{r.comment}</p> : <p className="italic text-muted-foreground">Tanpa komentar</p>}
                </div>
                <ReviewActions id={r.id} status={r.status} canDelete={can(user.role, "reviews:delete")} />
              </article>
            );
          })}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Halaman {page} dari {totalPages} · {count} ulasan</span>
          <div className="flex gap-2">
            {page > 1 && <Button asChild variant="outline" size="sm"><Link href={href(tab, page - 1)}>Sebelumnya</Link></Button>}
            {page < totalPages && <Button asChild variant="outline" size="sm"><Link href={href(tab, page + 1)}>Berikutnya</Link></Button>}
          </div>
        </div>
      )}
    </div>
  );
}
