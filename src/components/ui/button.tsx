import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Tombol "arcade": pill, outline arang 2px, bayangan offset keras yang "tertekan" saat ditekan.
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-ink font-label text-sm font-bold tracking-wide shadow-cartoon transition-[transform,box-shadow,background-color] active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:brightness-105",
        secondary: "bg-secondary text-secondary-foreground hover:brightness-105",
        destructive: "bg-accent text-accent-foreground hover:brightness-105",
        outline: "bg-card text-foreground hover:bg-muted",
        butter: "bg-butter text-on-pastel hover:brightness-105",
        ghost: "border-transparent bg-transparent shadow-none hover:bg-muted active:translate-y-0",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
