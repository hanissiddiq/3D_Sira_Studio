import { Tag } from "lucide-react";
import type { Tier } from "@/lib/pricing";

export function BulkDiscountBanner({ tiers, totalQty, discountPercent, nextTier }: {
  tiers: Tier[]; totalQty: number; discountPercent: number; nextTier: Tier | null;
}) {
  if (tiers.length === 0 || totalQty === 0) return null;
  return (
    <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
      <Tag className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        {discountPercent > 0 && <span className="font-medium">Diskon {discountPercent}% aktif. </span>}
        {nextTier
          ? `Tambah ${nextTier.min_quantity - totalQty} item lagi untuk diskon ${nextTier.percent}%.`
          : discountPercent > 0 ? "Anda mendapat diskon tertinggi." : null}
      </p>
    </div>
  );
}
