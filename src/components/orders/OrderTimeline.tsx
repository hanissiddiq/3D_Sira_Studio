import { STATUS_LABEL, formatDateTime, isOrderStatus } from "@/lib/order-status";

interface Entry { status: string; note: string | null; created_at: string }

export function OrderTimeline({ entries }: { entries: Entry[] }) {
  const sorted = [...entries].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return (
    <ol className="relative space-y-4 border-l pl-5">
      {sorted.map((e, i) => (
        <li key={`${e.created_at}-${i}`} className="relative">
          <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
          <p className="text-sm font-medium">{isOrderStatus(e.status) ? STATUS_LABEL[e.status] : e.status}</p>
          {e.note && <p className="text-sm text-muted-foreground">{e.note}</p>}
          <p className="text-xs text-muted-foreground">{formatDateTime(e.created_at)}</p>
        </li>
      ))}
    </ol>
  );
}
