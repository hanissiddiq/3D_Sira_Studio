"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NEXT_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import type { Role } from "@/lib/permissions";
import { updateOrderStatusAction } from "@/app/(dashboard)/admin/orders/actions";

interface Props {
  orderId: string;
  currentStatus: OrderStatus;
  paymentStatus: string;
  trackingNumber: string | null;
  role: Role;
}

export function OrderStatusForm({ orderId, currentStatus, paymentStatus, trackingNumber, role }: Props) {
  const options = NEXT_STATUSES[currentStatus].filter(
    (s) => !(s === "cancelled" && paymentStatus === "paid" && role !== "admin"),
  );
  const [status, setStatus] = useState<OrderStatus | "">(options[0] ?? "");
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">Tidak ada perubahan status yang tersedia.</p>;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;
    if (status === "cancelled" && !window.confirm("Batalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.")) return;
    setMessage(null);
    startTransition(async () => {
      const res = await updateOrderStatusAction({
        orderId, status, trackingNumber: tracking || undefined, note: note || undefined,
      });
      if (res.ok) { setMessage({ type: "ok", text: "Status diperbarui." }); setNote(""); }
      else setMessage({ type: "error", text: res.error });
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Ubah status ke</Label>
        <select id="status" value={status} disabled={isPending}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          className="flex h-9 w-full rounded-md border bg-background px-3 text-sm">
          {options.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      {(status === "shipped" || currentStatus === "in_production") && (
        <div className="space-y-2">
          <Label htmlFor="tracking">Nomor resi {status === "shipped" && <span className="text-red-600">*</span>}</Label>
          <Input id="tracking" value={tracking} maxLength={100} disabled={isPending}
            onChange={(e) => setTracking(e.target.value)} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="note">Catatan (opsional)</Label>
        <textarea id="note" value={note} maxLength={500} rows={3} disabled={isPending}
          onChange={(e) => setNote(e.target.value)}
          className="flex w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </div>

      {message && (
        <p role="status" className={message.type === "ok" ? "text-sm text-green-700" : "text-sm text-red-600"}>
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={isPending || !status}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
      </Button>
    </form>
  );
}
