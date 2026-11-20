"use client";

import { useDict } from "@/components/layout/LanguageProvider";
import { formatRupiah } from "@/lib/utils";

export function CartSummary({ subtotal, discount, discountPercent, shippingCost, total }: {
  subtotal: number; discount: number; discountPercent: number; shippingCost?: number | null; total: number;
}) {
  const t = useDict().summary;
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex justify-between"><dt>{t.subtotal}</dt><dd>{formatRupiah(subtotal)}</dd></div>
      {discount > 0 && (
        <div className="flex justify-between text-green-700 dark:text-green-400"><dt>{t.discount(discountPercent)}</dt><dd>−{formatRupiah(discount)}</dd></div>
      )}
      {shippingCost != null && <div className="flex justify-between"><dt>{t.shipping}</dt><dd>{formatRupiah(shippingCost)}</dd></div>}
      <div className="flex justify-between border-t pt-2 text-base font-semibold">
        <dt>{shippingCost != null ? t.total : t.estTotal}</dt>
        <dd>{formatRupiah(total + (shippingCost ?? 0))}</dd>
      </div>
    </dl>
  );
}
