import { cn } from "@/lib/utils";

export function ProgressBar({ pct, tone = "primary", className }: { pct: number; tone?: "primary" | "mint" | "peach"; className?: string }) {
  const fill = { primary: "bg-primary", mint: "bg-secondary", peach: "bg-accent" }[tone];
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
      className={cn("h-3 w-full overflow-hidden rounded-full border-[1.5px] border-ink bg-powder", className)}>
      <div className={cn("h-full border-r-[1.5px] border-ink", fill)} style={{ width: `${pct}%`, display: pct === 0 ? "none" : undefined }} />
    </div>
  );
}
