"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { formatDateTime } from "@/lib/order-status";
import { formatRupiah } from "@/lib/utils";
import { lookupOrderAction } from "@/app/(storefront)/orders/actions";

type Found = Extract<Awaited<ReturnType<typeof lookupOrderAction>>, { ok: true }>["order"];

export function OrderLookup({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode ?? "");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Found | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setOrder(null);
    startTransition(async () => {
      const res = await lookupOrderAction({ orderCode: code, email });
      if (res.ok) setOrder(res.order); else setError(res.error);
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="code">Kode pesanan</Label>
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SIRA-XXXXXXXX" autoComplete="off" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email saat memesan</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Cari pesanan
        </Button>
      </form>

      {order && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-mono">{order.order_code}</CardTitle>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-muted-foreground">Dibuat {formatDateTime(order.created_at)}</p>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <ul className="space-y-1">
              {order.order_items.map((it: { id: string; product_name: string; quantity: number; unit_price: number }) => (
                <li key={it.id} className="flex justify-between">
                  <span>{it.quantity}× {it.product_name}</span><span>{formatRupiah(it.quantity * it.unit_price)}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatRupiah(order.total)}</span></p>
            {order.tracking_number && <p>Nomor resi: <span className="font-mono">{order.tracking_number}</span></p>}
            <OrderTimeline entries={order.order_status_history} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
