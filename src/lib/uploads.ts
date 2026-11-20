"use client";

import { createDesignUploadsAction } from "@/app/(storefront)/cart/actions";
import { createClient } from "@/lib/supabase/client";

export interface UploadedDesign { logoPath?: string; snapshotPath?: string }

export async function uploadDesignAssets(params: { logoFile?: File | null; snapshot?: Blob }): Promise<UploadedDesign> {
  const { logoFile, snapshot } = params;
  if (!logoFile && !snapshot) return {};

  const res = await createDesignUploadsAction({
    logo: logoFile ? { contentType: logoFile.type as "image/png" | "image/jpeg" | "image/webp", size: logoFile.size } : undefined,
    snapshot: snapshot ? { size: snapshot.size } : undefined,
  });
  if (!res.ok) throw new Error(res.error);

  const storage = createClient().storage;
  const result: UploadedDesign = {};

  if (res.logo && logoFile) {
    const { error } = await storage.from("customer-uploads")
      .uploadToSignedUrl(res.logo.path, res.logo.token, logoFile, { contentType: logoFile.type });
    if (error) throw new Error("Upload logo gagal. Coba lagi.");
    result.logoPath = res.logo.path;
  }
  if (res.snapshot && snapshot) {
    const { error } = await storage.from("design-snapshots")
      .uploadToSignedUrl(res.snapshot.path, res.snapshot.token, snapshot, { contentType: "image/png" });
    if (error) throw new Error("Upload gambar desain gagal. Coba lagi.");
    result.snapshotPath = res.snapshot.path;
  }
  return result;
}
