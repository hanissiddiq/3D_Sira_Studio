"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/layout/LanguageProvider";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { ReviewModal } from "@/components/orders/ReviewModal";
import { openDokuPayment } from "@/lib/doku/popup";
import { formatDateTime } from "@/lib/order-status";
import { formatRupiah } from "@/lib/utils";
import { getPaymentLinkAction, lookupOrderAction, syncPaymentStatusAction } from "@/app/(storefront)/orders/actions";

type Found = Extract<Awaited<ReturnType<typeof lookupOrderAction>>, { ok: true }>["order"];
interface Item { id: string; product_name: string; quantity: number; unit_price: number; reviews: unknown }

const isReviewed = (r: unknown) => (Array.isArray(r) ? r.length > 0 : !!r);

export function OrderLookup({ initialCode }: { initialCode?: string }) {
  const d = useDict();
  const t = d.orders;
  const [code, setCode] = useState(initialCode ?? "");
  const [email, setEmail] = useState("");
  const [searched, setSearched] = useState<{ code: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Found | null>(null);
  const [reviewing, setReviewing] = useState<Item | null>(null);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [payMsg, setPayMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [payPending, startPay] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setOrder(null); setReviewedIds([]); setPayMsg(null);
    startTransition(async () => {
      const res = await lookupOrderAction({ orderCode: code, email });
      if (res.ok) { setOrder(res.order); setSearched({ code, email }); } else setError(res.error);
    });
  };

  const payNow = () => {
    if (!searched) return;
    setPayMsg(null);
    startPay(async () => {
      const res = await getPaymentLinkAction({ orderCode: searched.code, email: searched.email });
      if (!res.ok) return setPayMsg({ ok: false, text: res.error });
      const how = await openDokuPayment(res.payment);
      setPayMsg({ ok: true, text: how === "redirect" ? d.orders.payRedirecting : d.checkout.payPopupHint });
    });
  };

  const checkPayment = () => {
    if (!searched) return;
    setPayMsg(null);
    startPay(async () => {
      const res = await syncPaymentStatusAction({ orderCode: searched.code, email: searched.email });
      if (!res.ok) return setPayMsg({ ok: false, text: res.error });
      if (res.paid) {
        const fresh = await lookupOrderAction({ orderCode: searched.code, email: searched.email });
        if (fresh.ok) setOrder(fresh.order);
        setPayMsg({ ok: true, text: d.orders.payConfirmed });
      } else setPayMsg({ ok: false, text: d.orders.payStillPending });
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="code">{t.code}</Label>
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SIRA-XXXXXXXX" autoComplete="off" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t.emailLabel}</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t.search}
        </Button>
      </form>

      {order && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-mono">{order.order_code}</CardTitle>
              <OrderStatusBadge status={order.status} labels={t.statuses} />
            </div>
            <p className="text-sm text-muted-foreground">{t.created} {formatDateTime(order.created_at)}</p>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <ul className="space-y-2">
              {(order.order_items as Item[]).map((it) => {
                const reviewed = isReviewed(it.reviews) || reviewedIds.includes(it.id);
                return (
                  <li key={it.id} className="flex items-center justify-between gap-3">
                    <span>{it.quantity}× {it.product_name}</span>
                    <span className="flex items-center gap-3">
                      {order.status === "completed" && (
                        reviewed
                          ? <span className="text-xs text-muted-foreground">{d.reviews.reviewed}</span>
                          : <Button type="button" size="sm" variant="outline" onClick={() => setReviewing(it)}>{d.reviews.write}</Button>
                      )}
                      <span>{formatRupiah(it.quantity * it.unit_price)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="flex justify-between border-t pt-2 font-semibold"><span>{t.total}</span><span>{formatRupiah(order.total)}</span></p>
            {order.status === "pending_payment" && (
              <div className="space-y-2 rounded-xl border-2 border-ink bg-butter-soft p-3 text-on-pastel">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={payNow} disabled={payPending}>{payPending && <Loader2 className="animate-spin" />}{t.payNow}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={checkPayment} disabled={payPending}>{t.checkPayment}</Button>
                </div>
                {payMsg && <p role="status" className={payMsg.ok ? "text-xs font-bold" : "text-xs font-bold text-red-700"}>{payMsg.text}</p>}
              </div>
            )}
            {order.tracking_number && <p>{t.tracking}: <span className="font-mono">{order.tracking_number}</span></p>}
            <OrderTimeline entries={order.order_status_history} labels={t.statuses} />
          </CardContent>
        </Card>
      )}

      {reviewing && searched && (
        <ReviewModal orderCode={searched.code} email={searched.email} orderItemId={reviewing.id}
          productName={reviewing.product_name} onClose={() => setReviewing(null)}
          onSubmitted={(id) => setReviewedIds((ids) => [...ids, id])} />
      )}
    </div>
  );
}
