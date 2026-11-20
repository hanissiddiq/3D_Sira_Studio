import type { Metadata } from "next";
import { TierManager } from "@/components/admin/TierManager";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  await requirePermission("discounts:manage");
  const { data, error } = await (await createClient()).from("bulk_discount_tiers").select("id, min_quantity, percent").order("min_quantity");
  if (error) { console.error("tiers:", error); return <p className="text-sm text-red-600">Gagal memuat pengaturan.</p>; }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Pengaturan</h1>
      <TierManager tiers={data} />
    </div>
  );
}
