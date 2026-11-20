"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import { submitReviewAction } from "@/app/(storefront)/orders/actions";

interface Props {
  orderCode: string; email: string; orderItemId: string; productName: string;
  onClose: () => void; onSubmitted: (orderItemId: string) => void;
}

export function ReviewModal({ orderCode, email, orderItemId, productName, onClose, onSubmitted }: Props) {
  const t = useDict().reviews;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitReviewAction({ orderCode, email, orderItemId, rating, comment });
      if (res.ok) { setDone(true); onSubmitted(orderItemId); } else setError(res.error);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t.modalTitle(productName)}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md space-y-4 rounded-xl bg-background p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-semibold">{t.modalTitle(productName)}</h2>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label={t.close}><X className="h-4 w-4" /></Button>
        </div>
        {done ? (
          <>
            <p className="text-sm">{t.thanks}</p>
            <Button type="button" className="w-full" onClick={onClose}>{t.close}</Button>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t.rating}</Label>
              <div role="radiogroup" aria-label={t.rating} className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={t.star(n)}
                    onClick={() => setRating(n)}
                    className={cn("text-3xl leading-none", n <= rating ? "text-amber-500" : "text-muted-foreground/40")}>★</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-comment">{t.comment}</Label>
              <textarea id="review-comment" rows={4} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)}
                className="flex w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>{t.cancel}</Button>
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t.submit}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
