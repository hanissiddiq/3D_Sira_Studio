import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna tidak valid");
const meshName = z.string().trim().max(100);
const coord = z.number().min(-50).max(50);
const scaleCoord = z.number().min(0.001).max(50);

const colorRole = z.object({
  enabled: z.boolean(),
  label: z.string().trim().min(1, "Label wajib diisi").max(40),
  materials: z.array(meshName).max(20), // nama material di file .glb yang diwarnai
  defaultColor: hex,
});

/** Konfigurasi customizer per produk (disimpan di products.customizer_config). */
export const customizerConfigSchema = z
  .object({
    primary: colorRole,
    secondary: colorRole,
    text: z.object({ enabled: z.boolean(), maxLength: z.number().int().min(1).max(32) }),
    logo: z.object({ enabled: z.boolean() }),
    // Dekal (teks/logo) diproyeksikan ke satu mesh, koordinat lokal mesh tersebut.
    decal: z.object({
      mesh: meshName,
      position: z.tuple([coord, coord, coord]),
      rotation: z.tuple([coord, coord, coord]),
      scale: z.tuple([scaleCoord, scaleCoord, scaleCoord]),
    }),
  })
  .refine((c) => !(c.text.enabled || c.logo.enabled) || c.decal.mesh.length > 0, {
    message: "Nama mesh dekal wajib diisi jika teks atau logo aktif",
    path: ["decal", "mesh"],
  });
export type CustomizerConfig = z.infer<typeof customizerConfigSchema>;

export const DEFAULT_CUSTOMIZER_CONFIG: CustomizerConfig = {
  primary: { enabled: true, label: "Warna utama", materials: [], defaultColor: "#3b82f6" },
  secondary: { enabled: false, label: "Warna sekunder", materials: [], defaultColor: "#ffffff" },
  text: { enabled: false, maxLength: 16 },
  logo: { enabled: false },
  decal: { mesh: "", position: [0, 0, 0.5], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6] },
};

export function parseCustomizerConfig(raw: unknown): CustomizerConfig {
  const parsed = customizerConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_CUSTOMIZER_CONFIG;
}

const optionalText = z.string().trim().max(2000);

export const productFormSchema = z.object({
  slug: z.string().trim().toLowerCase().min(2, "Minimal 2 karakter").max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Hanya huruf kecil, angka, dan tanda hubung"),
  category: z.string().trim().min(2, "Kategori wajib diisi").max(50),
  kind: z.enum(["custom", "ready"]),
  name_id: z.string().trim().min(2, "Nama wajib diisi").max(120),
  name_en: z.string().trim().min(2, "Name is required").max(120),
  description_id: optionalText,
  description_en: optionalText,
  base_price: z.number("Harga wajib diisi").int().min(0).max(100_000_000),
  text_fee: z.number("Wajib diisi").int().min(0).max(10_000_000),
  logo_fee: z.number("Wajib diisi").int().min(0).max(10_000_000),
  weight_grams: z.number("Wajib diisi").int().min(1).max(100_000),
  stock: z.number().int().min(0).max(1_000_000).nullable(),
  is_active: z.boolean(),
  model_url: z.string().url().nullable(),
  images: z.array(z.string().url()).max(8),
  customizer_config: customizerConfigSchema,
});
export type ProductFormValues = z.infer<typeof productFormSchema>;

export const EMPTY_PRODUCT: ProductFormValues = {
  slug: "", category: "general", kind: "custom", name_id: "", name_en: "",
  description_id: "", description_en: "",
  base_price: 0, text_fee: 0, logo_fee: 0, weight_grams: 200, stock: null,
  is_active: true, model_url: null, images: [],
  customizer_config: DEFAULT_CUSTOMIZER_CONFIG,
};

export function slugify(input: string) {
  return input.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
