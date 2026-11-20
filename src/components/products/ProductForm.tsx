"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThreeCanvasLazy } from "@/components/customizer/ThreeCanvasLazy";
import type { InspectInfo } from "@/components/customizer/ThreeCanvas";
import { FileUploader } from "@/components/products/FileUploader";
import { DeleteProductButton } from "@/components/products/DeleteProductButton";
import {
  customizerConfigSchema, productFormSchema, slugify,
  type CustomizerConfig, type ProductFormValues,
} from "@/lib/validations/product";
import { cn } from "@/lib/utils";
import { createProductAction, updateProductAction } from "@/app/(dashboard)/admin/products/actions";

interface Props {
  mode: "create" | "edit";
  productId?: string;
  defaultValues: ProductFormValues;
  canDelete?: boolean;
}

const selectCls = "flex h-9 w-full rounded-md border bg-background px-3 text-sm";

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function MaterialsField({ value, onChange, detected }: { value: string[]; onChange: (v: string[]) => void; detected: string[] }) {
  const parse = (s: string) => [...new Set(s.split(",").map((x) => x.trim()).filter(Boolean))];
  const toggle = (n: string) => onChange(value.includes(n) ? value.filter((x) => x !== n) : [...value, n]);
  return (
    <div className="space-y-2">
      <Input key={value.join("|")} defaultValue={value.join(", ")} placeholder="Nama material, pisahkan dengan koma"
        onBlur={(e) => onChange(parse(e.target.value))} />
      {detected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {detected.map((n) => (
            <button key={n} type="button" onClick={() => toggle(n)}
              className={cn("rounded-full border px-2 py-0.5 text-xs",
                value.includes(n) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductForm({ mode, productId, defaultValues, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [detected, setDetected] = useState<InspectInfo>({ materials: [], meshes: [] });
  const onInspect = useCallback((info: InspectInfo) => setDetected(info), []);

  const {
    register, handleSubmit, watch, setValue, control, setError,
    formState: { errors, dirtyFields },
  } = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema), defaultValues });

  const modelUrl = watch("model_url");
  const images = watch("images");
  const config = watch("customizer_config");

  // Pratinjau memakai konfigurasi valid terakhir agar tidak berkedip saat input sedang diketik
  const configKey = JSON.stringify(config);
  const [previewConfig, setPreviewConfig] = useState<CustomizerConfig>(defaultValues.customizer_config);
  useEffect(() => {
    const parsed = customizerConfigSchema.safeParse(JSON.parse(configKey));
    if (parsed.success) setPreviewConfig(parsed.data);
  }, [configKey]);

  const previewState = useMemo(() => ({
    primaryColor: previewConfig.primary.defaultColor,
    secondaryColor: previewConfig.secondary.enabled ? previewConfig.secondary.defaultColor : undefined,
    text: previewConfig.text.enabled ? "SIRA".slice(0, previewConfig.text.maxLength) : undefined,
    font: "sans" as const,
    logoUrl: null,
  }), [previewConfig]);

  const onSubmit = (values: ProductFormValues) => {
    setFormError(null);
    startTransition(async () => {
      const res = mode === "create"
        ? await createProductAction(values)
        : await updateProductAction(productId!, values);
      if (!res.ok) {
        if (res.field === "slug") setError("slug", { message: res.error });
        setFormError(res.error);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    });
  };

  const triple = (name: "position" | "rotation" | "scale", label: string) => (
    <Field label={label} error={errors.customizer_config?.decal?.[name] ? "Nilai tidak valid" : undefined}>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <Input key={i} type="number" step="0.01"
            {...register(`customizer_config.decal.${name}.${i}` as `customizer_config.decal.${typeof name}.0`, { valueAsNumber: true })} />
        ))}
      </div>
    </Field>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Informasi produk</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama (Indonesia)" error={errors.name_id?.message}><Input {...register("name_id")} /></Field>
            <Field label="Name (English)" error={errors.name_en?.message}>
              <Input {...register("name_en", {
                onChange: (e) => {
                  if (mode === "create" && !dirtyFields.slug) setValue("slug", slugify(e.target.value), { shouldValidate: true });
                },
              })} />
            </Field>
            <Field label="Slug (URL)" error={errors.slug?.message}><Input {...register("slug")} /></Field>
            <Field label="Kategori" error={errors.category?.message}><Input {...register("category")} /></Field>
            <div className="sm:col-span-2">
              <Field label="Deskripsi (Indonesia)" error={errors.description_id?.message}>
                <textarea rows={3} {...register("description_id")} className="flex w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Description (English)" error={errors.description_en?.message}>
                <textarea rows={3} {...register("description_en")} className="flex w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" {...register("is_active")} /> Tampilkan di toko (aktif)
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Harga &amp; berat</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Harga dasar (Rp)" error={errors.base_price?.message}>
              <Input type="number" min={0} {...register("base_price", { valueAsNumber: true })} />
            </Field>
            <Field label="Berat per unit (gram)" error={errors.weight_grams?.message}>
              <Input type="number" min={1} {...register("weight_grams", { valueAsNumber: true })} />
            </Field>
            <Field label="Biaya tambahan teks (Rp)" error={errors.text_fee?.message}>
              <Input type="number" min={0} {...register("text_fee", { valueAsNumber: true })} />
            </Field>
            <Field label="Biaya tambahan logo (Rp)" error={errors.logo_fee?.message}>
              <Input type="number" min={0} {...register("logo_fee", { valueAsNumber: true })} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>File</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Model 3D (.glb, maks. 50 MB)</Label>
              {modelUrl ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="truncate">{decodeURIComponent(modelUrl.split("/").pop() ?? "")}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setValue("model_url", null, { shouldDirty: true })}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada model. Pratinjau memakai balok bawaan.</p>
              )}
              <FileUploader folder="models" label={modelUrl ? "Ganti model" : "Unggah model .glb"}
                accept=".glb,model/gltf-binary" maxBytes={50 * 1024 * 1024}
                contentTypeFor={(f) => (f.name.toLowerCase().endsWith(".glb") ? "model/gltf-binary" : null)}
                validate={async (f) => {
                  const head = new Uint8Array(await f.slice(0, 4).arrayBuffer());
                  return String.fromCharCode(...head) === "glTF" ? null : "File bukan GLB yang valid.";
                }}
                onUploaded={(url) => setValue("model_url", url, { shouldDirty: true })} />
            </div>

            <div className="space-y-2">
              <Label>Foto produk (maks. 8, JPG/PNG/WebP, 5 MB)</Label>
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((url) => (
                    <div key={url} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="aspect-square w-full rounded-md border object-cover" />
                      <button type="button" aria-label="Hapus foto"
                        onClick={() => setValue("images", images.filter((u) => u !== url), { shouldDirty: true })}
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <FileUploader folder="images" label="Tambah foto" accept="image/png,image/jpeg,image/webp"
                maxBytes={5 * 1024 * 1024} disabled={images.length >= 8}
                contentTypeFor={(f) => (["image/png", "image/jpeg", "image/webp"].includes(f.type) ? f.type : null)}
                onUploaded={(url) => setValue("images", [...images, url], { shouldDirty: true })} />
              {errors.images && <p className="text-sm text-red-600">Daftar foto tidak valid.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Konfigurasi customizer</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Warna utama</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Label" error={errors.customizer_config?.primary?.label?.message}>
                  <Input {...register("customizer_config.primary.label")} />
                </Field>
                <Field label="Warna bawaan">
                  <Input type="color" className="h-9 w-20 p-1" {...register("customizer_config.primary.defaultColor")} />
                </Field>
              </div>
              <Field label="Material yang diwarnai" hint="Klik nama material hasil deteksi dari model, atau ketik manual.">
                <Controller control={control} name="customizer_config.primary.materials"
                  render={({ field }) => <MaterialsField value={field.value} onChange={field.onChange} detected={detected.materials} />} />
              </Field>
            </div>

            <div className="space-y-3 border-t pt-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" {...register("customizer_config.secondary.enabled")} /> Warna sekunder
              </label>
              {config.secondary.enabled && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Label" error={errors.customizer_config?.secondary?.label?.message}>
                      <Input {...register("customizer_config.secondary.label")} />
                    </Field>
                    <Field label="Warna bawaan">
                      <Input type="color" className="h-9 w-20 p-1" {...register("customizer_config.secondary.defaultColor")} />
                    </Field>
                  </div>
                  <Field label="Material yang diwarnai">
                    <Controller control={control} name="customizer_config.secondary.materials"
                      render={({ field }) => <MaterialsField value={field.value} onChange={field.onChange} detected={detected.materials} />} />
                  </Field>
                </>
              )}
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">Teks &amp; logo (dekal)</h3>
              <div className="flex flex-wrap gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" {...register("customizer_config.text.enabled")} /> Izinkan teks</label>
                <label className="flex items-center gap-2"><input type="checkbox" {...register("customizer_config.logo.enabled")} /> Izinkan logo</label>
              </div>
              {config.text.enabled && (
                <Field label="Panjang teks maksimal" error={errors.customizer_config?.text?.maxLength?.message}>
                  <Input type="number" min={1} max={32} className="w-28"
                    {...register("customizer_config.text.maxLength", { valueAsNumber: true })} />
                </Field>
              )}
              {(config.text.enabled || config.logo.enabled) && (
                <>
                  <Field label="Mesh target dekal" error={errors.customizer_config?.decal?.mesh?.message ?? errors.customizer_config?.root?.message}
                    hint="Bagian model tempat teks/logo ditempel. Atur posisi/rotasi/skala sambil melihat pratinjau.">
                    <Input list="detected-meshes" {...register("customizer_config.decal.mesh")} />
                    <datalist id="detected-meshes">{detected.meshes.map((m) => <option key={m} value={m} />)}</datalist>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {triple("position", "Posisi (x, y, z)")}
                    {triple("rotation", "Rotasi (rad)")}
                    {triple("scale", "Skala")}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Simpan produk" : "Simpan perubahan"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/products")} disabled={isPending}>Batal</Button>
          {mode === "edit" && canDelete && productId && (
            <div className="ml-auto"><DeleteProductButton productId={productId} name={defaultValues.name_id} /></div>
          )}
        </div>
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <Card>
          <CardHeader><CardTitle>Pratinjau langsung</CardTitle></CardHeader>
          <CardContent>
            <ThreeCanvasLazy className="h-[420px] w-full overflow-hidden rounded-lg border bg-muted/40"
              modelUrl={modelUrl} config={previewConfig} state={previewState} onInspect={onInspect} />
            <p className="mt-2 text-xs text-muted-foreground">
              {detected.materials.length > 0
                ? `Terdeteksi ${detected.materials.length} material dan ${detected.meshes.length} mesh. Teks contoh: “SIRA”.`
                : "Memuat model…"}
            </p>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
