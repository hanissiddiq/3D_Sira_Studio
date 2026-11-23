import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderStatusForm } from "@/components/orders/OrderStatusForm";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, isOrderStatus } from "@/lib/order-status";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = { title: "Detail Pesanan" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Customization {
  primaryColor?: string; secondaryColor?: string; text?: string;
  font?: string; logoPath?: string; snapshotPath?: string;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("orders:read");
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(status, note, created_at)")
    .eq("id", id).maybeSingle();

  if (error) {
    console.error("order detail:", error);
    return <p className="text-sm text-red-600">Gagal memuat pesanan.</p>;
  }
  if (!order) notFound();

  // URL bertanda tangan (5 menit) untuk file privat milik pelanggan
  const signed = async (bucket: string, path?: string) => {
    if (!path) return null;
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
    return data?.signedUrl ?? null;
  };
  const items = await Promise.all(
    (order.order_items as { id: string; product_name: string; quantity: number; unit_price: number; customization: Customization }[])
      .map(async (it) => ({
        ...it,
        snapshotUrl: await signed("design-snapshots", it.customization?.snapshotPath),
        logoUrl: await signed("customer-uploads", it.customization?.logoPath),
      })),
  );

  const addr = order.shipping_address as { address: string; city: string; province: string; postalCode: string };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Semua pesanan
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold">{order.order_code}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">Dibuat {formatDateTime(order.created_at)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Item pesanan</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {items.map((it) => (
                <div key={it.id} className="flex flex-col gap-3 border-b pb-5 last:border-0 last:pb-0 sm:flex-row">
                  {it.snapshotUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.snapshotUrl} alt={`Desain ${it.product_name}`}
                      className="h-28 w-28 shrink-0 rounded-md border object-cover" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1 text-sm">
                    <p className="font-medium">{it.product_name}</p>
                    <p className="text-muted-foreground">{it.quantity} × {formatRupiah(it.unit_price)}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                      {it.customization?.primaryColor && (
                        <span className="inline-flex items-center gap-1">
                          <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: it.customization.primaryColor }} />
                          {it.customization.primaryColor}
                        </span>
                      )}
                      {it.customization?.secondaryColor && (
                        <span className="inline-flex items-center gap-1">
                          <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: it.customization.secondaryColor }} />
                          {it.customization.secondaryColor}
                        </span>
                      )}
                      {it.customization?.text && <span>Teks: “{it.customization.text}” ({it.customization.font})</span>}
                      {it.logoUrl && <a href={it.logoUrl} target="_blank" rel="noreferrer" className="underline">Lihat logo</a>}
                    </div>
                  </div>
                  <p className="text-sm font-medium">{formatRupiah(it.unit_price * it.quantity)}</p>
                </div>
              ))}
              <dl className="space-y-1 border-t pt-4 text-sm">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatRupiah(order.subtotal)}</dd></div>
                {order.discount > 0 && <div className="flex justify-between"><dt>Diskon</dt><dd>−{formatRupiah(order.discount)}</dd></div>}
                <div className="flex justify-between"><dt>Ongkir</dt><dd>{formatRupiah(order.shipping_cost)}</dd></div>
                <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatRupiah(order.total)}</dd></div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Riwayat status</CardTitle></CardHeader>
            <CardContent><OrderTimeline entries={order.order_status_history} /></CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Pelanggan</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.customer_name}</p>
              <p>{order.customer_email}</p>
              <p>{order.customer_phone}</p>
              <p className="pt-2 text-muted-foreground">
                {addr.address}, {addr.city}, {addr.province} {addr.postalCode}
              </p>
              <p className="pt-2">Kurir: {order.courier ?? "-"}</p>
              <p>Resi: {order.tracking_number ?? "-"}</p>
              <p>Pembayaran: {order.payment_status}{order.paid_at ? ` · ${formatDateTime(order.paid_at)}` : ""}</p>
              {order.payment_provider && (
                <p className="text-muted-foreground">
                  {order.payment_provider.toUpperCase()} · percobaan {order.payment_attempts}
                  {order.payment_expires_at ? ` · kedaluwarsa ${formatDateTime(order.payment_expires_at)}` : ""}
                  {order.qris_reference ? ` · ref ${order.qris_reference}` : ""}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Perbarui status</CardTitle></CardHeader>
            <CardContent>
              {isOrderStatus(order.status) && (
                <OrderStatusForm orderId={order.id} currentStatus={order.status}
                  paymentStatus={order.payment_status} trackingNumber={order.tracking_number}
                  role={user.role} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
