"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteReviewAction, moderateReviewAction } from "@/app/(dashboard)/admin/reviews/actions";

export function ReviewActions({ id, status, canDelete }: { id: string; status: string; canDelete: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) router.refresh(); else setError(res.error ?? "Gagal.");
    });
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        {status !== "approved" && (
          <Button type="button" size="sm" disabled={pending} onClick={() => run(() => moderateReviewAction(id, "approved"))}>
            <Check className="mr-1 h-4 w-4" /> Setujui
          </Button>
        )}
        {status !== "rejected" && (
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => moderateReviewAction(id, "rejected"))}>
            <X className="mr-1 h-4 w-4" /> Tolak
          </Button>
        )}
        {canDelete && (
          <Button type="button" size="sm" variant="destructive" disabled={pending} aria-label="Hapus ulasan"
            onClick={() => { if (window.confirm("Hapus ulasan ini secara permanen?")) run(() => deleteReviewAction(id)); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
