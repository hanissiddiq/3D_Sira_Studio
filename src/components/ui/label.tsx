import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("font-label text-xs font-bold uppercase tracking-wider text-foreground", className)} {...props} />;
}
