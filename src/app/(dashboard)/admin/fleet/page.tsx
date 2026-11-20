import type { Metadata } from "next";
import { PrinterManager, type PrinterRow } from "@/components/admin/PrinterManager";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { printProgress } from "@/lib/workshop";

export const metadata: Metadata = { title: "Farm Fleet Live" };

export default async function FleetPage() {
  const user = await requirePermission("workshop:manage");
  const supabase = await createClient();
  const { data, error } = await supabase.from("printers")
    .select("id, name, model, nozzle, status, current_label, current_order_id").order("name");
  if (error) { console.error("fleet:", error); return <p className="text-sm text-red-600">Gagal memuat armada.</p>; }

  // Estimasi progres dari print_jobs pesanan yang sedang dikerjakan
  const orderIds = data.map((p) => p.current_order_id).filter((x): x is string => !!x);
  const jobs = orderIds.length
    ? (await supabase.from("print_jobs").select("order_id, est_minutes, started_at").in("order_id", orderIds)).data ?? []
    : [];
  const rows: PrinterRow[] = data.map((p) => {
    const job = jobs.find((j) => j.order_id === p.current_order_id);
    return { id: p.id, name: p.name, model: p.model, nozzle: p.nozzle, status: p.status, current_label: p.current_label,
      progress: printProgress(job?.started_at ?? null, job?.est_minutes) };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Farm Fleet Live</h1>
        <p className="text-sm text-muted-foreground">Kelola armada printer. Progres cetak adalah estimasi dari durasi yang diinput saat validasi, bukan telemetri mesin.</p>
      </div>
      <PrinterManager printers={rows} canDelete={can(user.role, "orders:delete")} />
    </div>
  );
}
