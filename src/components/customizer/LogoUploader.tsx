"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

interface Props { logoUrl: string | null; onChange: (file: File | null) => void }

export function LogoUploader({ logoUrl, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED.includes(file.type)) return setError("Format harus PNG, JPG, atau WebP.");
    if (file.size > MAX_BYTES) return setError("Ukuran maksimal 2 MB.");
    setError(null);
    onChange(file);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="logo-file">Logo</Label>
      <div className="flex items-center gap-3">
        <input ref={inputRef} id="logo-file" type="file" accept={ALLOWED.join(",")} onChange={pick} className="hidden" />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          {logoUrl ? "Ganti logo" : "Unggah logo"}
        </Button>
        {logoUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="Pratinjau logo" className="h-10 w-10 rounded border object-contain" />
            <Button type="button" variant="ghost" size="sm" onClick={() => { setError(null); onChange(null); }}>Hapus</Button>
          </>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-muted-foreground">PNG/JPG/WebP, maks. 2 MB. Latar transparan (PNG) paling bagus.</p>
    </div>
  );
}
