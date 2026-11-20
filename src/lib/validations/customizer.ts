import { z } from "zod";

export const customizationSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna tidak valid"),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  text: z.string().trim().max(32, "Maksimal 32 karakter").optional(),
  font: z.enum(["sans", "serif", "mono", "display"]).default("sans"),
  // Path dibuat server saat signed upload: logos/<uuid>.<ext> dan snapshots/<uuid>.png
  logoPath: z.string().regex(/^logos\/[\w-]+\.(png|jpg|jpeg|webp)$/).optional(),
  snapshotPath: z.string().regex(/^snapshots\/[\w-]+\.png$/).optional(),
});
export type Customization = z.infer<typeof customizationSchema>;
