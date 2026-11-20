"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface Props {
  folder: "models" | "images";
  accept: string;
  maxBytes: number;
  label: string;
  contentTypeFor: (file: File) => string | null; // null = tipe tidak diizinkan
  validate?: (file: File) => Promise<string | null>;
  onUploaded: (publicUrl: string) => void;
  disabled?: boolean;
}

export function FileUploader({ folder, accept, maxBytes, label, contentTypeFor, validate, onUploaded, disabled }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    const contentType = contentTypeFor(file);
    if (!contentType) return setError("Tipe file tidak diizinkan.");
    if (file.size > maxBytes) return setError(`Ukuran maksimal ${(maxBytes / 1024 / 1024).toFixed(0)} MB.`);
    const invalid = await validate?.(file);
    if (invalid) return setError(invalid);

    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("product-assets")
      .upload(path, file, { contentType, cacheControl: "31536000", upsert: false });
    setBusy(false);
    if (upErr) {
      console.error("upload failed:", upErr);
      return setError("Upload gagal. Pastikan Anda masih login dan coba lagi.");
    }
    onUploaded(supabase.storage.from("product-assets").getPublicUrl(path).data.publicUrl);
  };

  return (
    <div className="space-y-1">
      <input ref={inputRef} type="file" accept={accept} onChange={pick} className="hidden" />
      <Button type="button" variant="outline" size="sm" disabled={disabled || busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        {busy ? "Mengunggah…" : label}
      </Button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
