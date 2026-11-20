import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Chip status: pill pastel + outline 1.5px, label Space Grotesk.
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border-[1.5px] border-ink px-2.5 py-0.5 font-label text-[11px] font-bold uppercase tracking-wider text-on-pastel",
  {
    variants: {
      tone: {
        plain: "bg-card text-foreground",
        sky: "bg-powder",
        powder: "bg-powder",
        mint: "bg-mint-soft",
        mintStrong: "bg-mint",
        peach: "bg-peach-soft",
        peachStrong: "bg-peach",
        lilac: "bg-lilac-soft",
        butter: "bg-butter-soft",
        butterStrong: "bg-butter",
        blush: "bg-blush-soft",
      },
    },
    defaultVariants: { tone: "plain" },
  },
);

export function Badge({ className, tone, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
