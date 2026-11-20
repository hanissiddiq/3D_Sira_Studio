"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/order-status";
import { updateOrderStatusAction } from "@/app/(dashboard)/admin/orders/actions";

export function AdvanceButton({ orderId, to, label, variant = "default", confirm }: {
  orderId: string; to: OrderStatus; label: string; variant?: "default" | "secondary" | "outline" | "destructive" | "butter"; confirm?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = () => {
    if (confirm && !window.confirm(confirm)) return;
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatusAction({ orderId, status: to });
      if (res.ok) router.refresh(); else setError(res.error);
    });
  };
  return (
    <div className="space-y-1">
      <Button type="button" size="sm" variant={variant} className="w-full" onClick={run} disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}{label}
      </Button>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
