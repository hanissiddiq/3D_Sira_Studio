"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;

const schema = z.object({
  logo: z.object({
    contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
    size: z.number().int().positive().max(2 * 1024 * 1024),
  }).optional(),
  snapshot: z.object({ size: z.number().int().positive().max(5 * 1024 * 1024) }).optional(),
});

type Signed = { path: string; token: string };
export type DesignUploadsResult =
  | { ok: true; logo?: Signed; snapshot?: Signed }
  | { ok: false; error: string };

/**
 * Pembeli tamu tidak punya akses storage. Server membuat path (uuid acak) dan token
 * upload sekali pakai; batas ukuran & tipe MIME ditegakkan oleh konfigurasi bucket.
 */
export async function createDesignUploadsAction(input: z.input<typeof schema>): Promise<DesignUploadsResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Permintaan upload tidak valid." };

  const admin = createAdminClient();
  const id = randomUUID();
  const out: { logo?: Signed; snapshot?: Signed } = {};

  if (parsed.data.logo) {
    const path = `logos/${id}.${EXT[parsed.data.logo.contentType]}`;
    const { data, error } = await admin.storage.from("customer-uploads").createSignedUploadUrl(path);
    if (error || !data) { console.error("logo signed url:", error); return { ok: false, error: "Gagal menyiapkan upload logo." }; }
    out.logo = { path, token: data.token };
  }
  if (parsed.data.snapshot) {
    const path = `snapshots/${id}.png`;
    const { data, error } = await admin.storage.from("design-snapshots").createSignedUploadUrl(path);
    if (error || !data) { console.error("snapshot signed url:", error); return { ok: false, error: "Gagal menyiapkan upload desain." }; }
    out.snapshot = { path, token: data.token };
  }
  return { ok: true, ...out };
}
