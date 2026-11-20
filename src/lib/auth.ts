import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can, type Permission, type Role } from "@/lib/permissions";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("id, full_name, role").eq("id", user.id).single();
  return profile ? { ...profile, email: user.email ?? "", role: profile.role as Role } : null;
}

// Panggil di layout admin DAN di setiap Server Action sensitif.
export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, permission)) redirect("/login?error=forbidden");
  return user;
}
