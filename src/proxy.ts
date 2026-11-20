// Next.js 16+: proxy.ts. Untuk Next.js 15 ganti nama file jadi middleware.ts
// dan nama fungsi jadi `middleware`.
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|models/|api/webhooks/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb)$).*)",
  ],
};
