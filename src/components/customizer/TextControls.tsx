"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FontKey } from "./ThreeCanvas";

const FONTS: { key: FontKey; label: string; css: string }[] = [
  { key: "sans", label: "Sans", css: "system-ui, sans-serif" },
  { key: "serif", label: "Serif", css: "Georgia, serif" },
  { key: "mono", label: "Mono", css: "ui-monospace, monospace" },
  { key: "display", label: "Display", css: "Impact, 'Arial Black', sans-serif" },
];

interface Props {
  text: string; font: FontKey; maxLength: number;
  onTextChange: (t: string) => void; onFontChange: (f: FontKey) => void;
}

export function TextControls({ text, font, maxLength, onTextChange, onFontChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="custom-text">Teks</Label>
        <Input id="custom-text" value={text} maxLength={maxLength}
          onChange={(e) => onTextChange(e.target.value)} placeholder="Ketik teks…" />
        <p className="text-right text-xs text-muted-foreground">{text.length}/{maxLength}</p>
      </div>
      <div role="radiogroup" aria-label="Font" className="flex flex-wrap gap-2">
        {FONTS.map((f) => (
          <button key={f.key} type="button" role="radio" aria-checked={font === f.key}
            onClick={() => onFontChange(f.key)} style={{ fontFamily: f.css }}
            className={cn("rounded-md border px-3 py-1.5 text-sm",
              font === f.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
