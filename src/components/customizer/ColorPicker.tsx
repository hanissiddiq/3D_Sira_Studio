"use client";

import { cn } from "@/lib/utils";

const PRESETS = ["#111111", "#ffffff", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

export function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((c) => (
          <button key={c} type="button" onClick={() => onChange(c)} aria-label={`${label} ${c}`}
            aria-pressed={value.toLowerCase() === c}
            className={cn("h-8 w-8 rounded-full border-2 transition",
              value.toLowerCase() === c ? "border-primary ring-2 ring-primary/30" : "border-border")}
            style={{ backgroundColor: c }} />
        ))}
        <label className="relative flex h-8 cursor-pointer items-center gap-2 rounded-md border px-2 text-xs">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
            className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" aria-label={`${label} kustom`} />
          <span className="font-mono">{value}</span>
        </label>
      </div>
    </fieldset>
  );
}
