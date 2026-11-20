import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { getCurrentUser } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin Sira 3D" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!STAFF_ROLES.includes(user.role)) redirect("/login?error=forbidden");

  const supabase = await createClient();
  const { data } = await supabase.rpc("fleet_summary");
  const fleet = data && (data as { total: number }).total > 0 ? (data as { online: number; total: number }) : null;

  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <AdminSidebar role={user.role} fullName={user.full_name ?? "Staff"} email={user.email} fleet={fleet} />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
