export const ORDER_STATUSES = [
  "pending_payment", "paid", "in_production", "qc_finishing", "packing", "shipped", "completed", "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Menunggu pembayaran",
  paid: "Validasi & slicing",
  in_production: "Sedang dicetak",
  qc_finishing: "QC & finishing",
  packing: "Packing & kurir",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

// Warna pastel sesuai design system (chip + outline arang)
export const STATUS_CLASS: Record<OrderStatus, string> = {
  pending_payment: "bg-butter-soft text-on-pastel",
  paid: "bg-peach-soft text-on-pastel",
  in_production: "bg-powder text-on-pastel",
  qc_finishing: "bg-lilac-soft text-on-pastel",
  packing: "bg-mint-soft text-on-pastel",
  shipped: "bg-mint text-on-pastel",
  completed: "bg-secondary text-on-pastel",
  cancelled: "bg-blush-soft text-on-pastel",
};

// Cermin dari update_order_status() di SQL (hanya untuk UX; SQL tetap otoritatif).
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["cancelled"],
  paid: ["in_production", "cancelled"],
  in_production: ["qc_finishing", "cancelled"],
  qc_finishing: ["packing", "in_production", "cancelled"],
  packing: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

export function isOrderStatus(v: unknown): v is OrderStatus {
  return typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
