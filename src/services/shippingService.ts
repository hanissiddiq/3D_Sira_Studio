import "server-only";

export interface ShippingOption {
  courier: string;
  service: string;
  label: string;
  cost: number; // Rupiah
  etaDays: string;
}

// PLACEHOLDER tarif flat per kg. Ganti isi getShippingOptions() dengan adapter
// penyedia ongkir pilihan Anda (mis. agregator kurir) tanpa mengubah pemanggilnya.
const ORIGIN_PROVINCE = (process.env.SHIPPING_ORIGIN_PROVINCE ?? "Aceh").toLowerCase();

const TARIFF = [
  { courier: "standard", service: "reguler",  label: "Reguler",  local: 9000,  other: 18000, eta: "3-7" },
  { courier: "standard", service: "ekspres",  label: "Ekspres",  local: 15000, other: 30000, eta: "1-3" },
];

export function getShippingOptions(params: { province: string; totalWeightGrams: number }): ShippingOption[] {
  const kg = Math.max(1, Math.ceil(params.totalWeightGrams / 1000));
  const isLocal = params.province.trim().toLowerCase() === ORIGIN_PROVINCE;
  return TARIFF.map((t) => ({
    courier: t.courier,
    service: t.service,
    label: t.label,
    cost: (isLocal ? t.local : t.other) * kg,
    etaDays: t.eta,
  }));
}
