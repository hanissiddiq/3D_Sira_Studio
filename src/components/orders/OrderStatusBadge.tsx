import { cn } from "@/lib/utils";
import { STATUS_CLASS, STATUS_LABEL, isOrderStatus } from "@/lib/order-status";

export function OrderStatusBadge({ status, labels }: { status: string; labels?: Record<string, string> }) {
  const valid = isOrderStatus(status);
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border-[1.5px] border-ink px-2.5 py-0.5 font-label text-[11px] font-bold uppercase tracking-wider",
      valid ? STATUS_CLASS[status] : "bg-muted text-muted-foreground",
    )}>
      {labels?.[status] ?? (valid ? STATUS_LABEL[status] : status)}
    </span>
  );
}
