import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { getCurrentUser } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/permissions";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin Sira Studio" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!STAFF_ROLES.includes(user.role)) redirect("/login?error=forbidden");

  return (
    <div className="flex min-h-svh flex-col bg-muted/30 md:flex-row">
      <AdminSidebar role={user.role} fullName={user.full_name ?? "Staff"} email={user.email} />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
