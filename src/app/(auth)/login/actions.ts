"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { STAFF_ROLES, type Role } from "@/lib/permissions";

export type LoginResult = { error: string };

// Cegah open redirect: hanya path internal /admin yang diizinkan.
function safeNext(next?: string) {
  return next && /^\/admin(\/[\w\-/]*)?$/.test(next) ? next : "/admin";
}

export async function loginAction(values: LoginInput, next?: string): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { error: "Data login tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  // Pesan generik: tidak membocorkan apakah email terdaftar.
  if (error || !data.user) return { error: "Email atau password salah." };

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", data.user.id).single();

  if (!profile || !STAFF_ROLES.includes(profile.role as Role)) {
    await supabase.auth.signOut(); // akun valid tapi bukan staff
    return { error: "Akun ini tidak memiliki akses dashboard." };
  }

  redirect(safeNext(next));
}
