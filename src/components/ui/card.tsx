import * as React from "react";
import { cn } from "@/lib/utils";

type DivProps = React.ComponentProps<"div">;

// Level 1: kartu putih, outline 1.5px, bayangan offset 4px.
export function Card({ className, ...props }: DivProps) {
  return <div className={cn("rounded-xl border-[1.5px] border-ink bg-card text-card-foreground shadow-cartoon", className)} {...props} />;
}
export function CardHeader({ className, ...props }: DivProps) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}
export function CardTitle({ className, ...props }: DivProps) {
  return <div className={cn("text-lg font-bold leading-tight tracking-tight", className)} {...props} />;
}
export function CardDescription({ className, ...props }: DivProps) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}
