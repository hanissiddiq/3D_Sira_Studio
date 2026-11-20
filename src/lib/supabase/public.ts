import { createClient } from "@supabase/supabase-js";

// Klien anon tanpa cookie: untuk data publik agar halaman tidak dipaksa dinamis.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
