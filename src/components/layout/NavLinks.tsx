"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLinks({ links, className }: { links: { href: string; label: string }[]; className?: string }) {
  const pathname = usePathname();
  return (
    <>
      {links.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-full border-2 px-3.5 py-1.5 font-label text-xs font-bold transition",
              active ? "border-ink bg-primary text-white shadow-cartoon" : "border-transparent hover:bg-muted",
              className,
            )}>
            {l.label}
          </Link>
        );
      })}
    </>
  );
}
