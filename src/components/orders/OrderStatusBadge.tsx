import { cn } from "@/lib/utils";
import { STATUS_CLASS, STATUS_LABEL, isOrderStatus } from "@/lib/order-status";

export function OrderStatusBadge({ status }: { status: string }) {
  const valid = isOrderStatus(status);
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      valid ? STATUS_CLASS[status] : "bg-muted text-muted-foreground",
    )}>
      {valid ? STATUS_LABEL[status] : status}
    </span>
  );
}
