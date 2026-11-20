"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image as ImageIcon, LayoutDashboard, LogOut, Menu, Package, ShoppingBag, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { can, type Permission, type Role } from "@/lib/permissions";
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const NAV: { href: string; label: string; icon: typeof Package; permission: Permission | null }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: null },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingBag, permission: "orders:read" },
  { href: "/admin/products", label: "Produk", icon: Package, permission: "products:write" },
  { href: "/admin/gallery", label: "Galeri", icon: ImageIcon, permission: "gallery:write" },
  { href: "/admin/reviews", label: "Ulasan", icon: Star, permission: "reviews:moderate" },
];

interface Props { role: Role; fullName: string; email: string }

export function AdminSidebar({ role, fullName, email }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => !n.permission || can(role, n.permission)); // UX saja; keamanan di server

  const content = (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5 text-lg font-semibold">Sira Studio</div>
      <nav className="flex-1 space-y-1 px-2" aria-label="Menu admin">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <p className="truncate text-sm font-medium">{fullName}</p>
        <p className="truncate text-xs text-muted-foreground">{email} · {role}</p>
        <form action={logoutAction} className="mt-3">
          <Button type="submit" variant="outline" size="sm" className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Keluar
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
        <span className="font-semibold">Sira Studio</span>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Buka menu">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-background shadow-lg">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2"
              onClick={() => setOpen(false)} aria-label="Tutup menu">
              <X className="h-5 w-5" />
            </Button>
            {content}
          </aside>
        </div>
      )}
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
        <div className="sticky top-0 h-svh">{content}</div>
      </aside>
    </>
  );
}
