import type { Metadata } from "next";
import { MaterialManager } from "@/components/admin/MaterialManager";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Manajemen Material" };

export default async function MaterialsPage() {
  const user = await requirePermission("workshop:manage");
  const { data, error } = await (await createClient()).from("materials").select("*").order("name");
  if (error) { console.error("materials:", error); return <p className="text-sm text-red-600">Gagal memuat material.</p>; }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Material</h1>
        <p className="text-sm text-muted-foreground">Stok filamen berkurang otomatis saat pekerjaan cetak dimulai di Slicing & Validasi (berdasarkan estimasi gram).</p>
      </div>
      <MaterialManager materials={data} canDelete={can(user.role, "orders:delete")} />
    </div>
  );
}
