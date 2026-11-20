import { formatRupiah } from "@/lib/utils";

export function CartSummary({ subtotal, discount, discountPercent, shippingCost, total }: {
  subtotal: number; discount: number; discountPercent: number; shippingCost?: number | null; total: number;
}) {
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatRupiah(subtotal)}</dd></div>
      {discount > 0 && (
        <div className="flex justify-between text-green-700"><dt>Diskon {discountPercent}%</dt><dd>−{formatRupiah(discount)}</dd></div>
      )}
      {shippingCost != null && <div className="flex justify-between"><dt>Ongkir</dt><dd>{formatRupiah(shippingCost)}</dd></div>}
      <div className="flex justify-between border-t pt-2 text-base font-semibold">
        <dt>{shippingCost != null ? "Total" : "Estimasi total"}</dt>
        <dd>{formatRupiah(total + (shippingCost ?? 0))}</dd>
      </div>
    </dl>
  );
}
