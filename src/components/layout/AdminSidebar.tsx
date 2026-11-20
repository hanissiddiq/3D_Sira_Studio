"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes, ClipboardList, Image as ImageIcon, Layers, LogOut, Menu, Package, ScanLine,
  Settings, ShoppingBag, Star, Truck, Waypoints, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { can, type Permission, type Role } from "@/lib/permissions";
import { logoutAction } from "@/app/(dashboard)/admin/actions";
import { BrandMark } from "./BrandMark";
import { ThemeToggle } from "./ThemeToggle";

type Item = { href: string; label: string; icon: typeof Package; permission: Permission | null };
const WORKSHOP: Item[] = [
  { href: "/admin", label: "Antrean Cetak", icon: ClipboardList, permission: "workshop:manage" },
  { href: "/admin/fleet", label: "Farm Fleet Live", icon: Waypoints, permission: "workshop:manage" },
  { href: "/admin/slicing", label: "Slicing & Validasi", icon: ScanLine, permission: "workshop:manage" },
  { href: "/admin/materials", label: "Manajemen Material", icon: Layers, permission: "workshop:manage" },
  { href: "/admin/logistics", label: "Logistik & Kirim", icon: Truck, permission: "workshop:manage" },
];
const STORE: Item[] = [
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingBag, permission: "orders:read" },
  { href: "/admin/products", label: "Produk", icon: Boxes, permission: "products:write" },
  { href: "/admin/gallery", label: "Galeri", icon: ImageIcon, permission: "gallery:write" },
  { href: "/admin/reviews", label: "Ulasan", icon: Star, permission: "reviews:moderate" },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings, permission: "discounts:manage" },
];

interface Props {
  role: Role; fullName: string; email: string; fleet: { online: number; total: number } | null;
}

export function AdminSidebar({ role, fullName, email, fleet }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visible = (items: Item[]) => items.filter((n) => !n.permission || can(role, n.permission)); // UX saja; keamanan di server & RLS
  const pct = fleet && fleet.total > 0 ? Math.round((fleet.online / fleet.total) * 100) : 0;

  const renderGroup = (title: string, items: Item[]) => {
    const list = visible(items);
    if (list.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="px-3 pb-1 pt-3 font-label text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
        {list.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 px-3 py-2 text-sm font-bold transition",
                active ? "border-ink bg-primary text-white shadow-cartoon" : "border-transparent text-foreground/80 hover:bg-muted",
              )}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          );
        })}
      </div>
    );
  };

  const content = (
    <div className="flex h-full flex-col gap-3 p-4">
      <BrandMark sub="PLAYFUL FARM CONSOLE" href="/admin" />
      {fleet && (
        <div className="rounded-xl border-2 border-ink bg-card p-3 shadow-cartoon">
          <div className="flex items-center justify-between font-label text-xs font-bold">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary" />{fleet.online}/{fleet.total} Online</span>
            <span className="rounded-full bg-mint-soft px-2 py-0.5 text-on-pastel">{pct}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full border-[1.5px] border-ink bg-powder"><div className="h-full bg-secondary" style={{ width: `${pct}%` }} /></div>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto" aria-label="Menu admin">
        {renderGroup("Workshop", WORKSHOP)}
        {renderGroup("Katalog & Toko", STORE)}
      </nav>
      <div className="space-y-3 rounded-xl border-2 border-ink bg-peach-soft p-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{fullName}</p>
            <p className="truncate font-label text-[10px] text-muted-foreground">{email} · {role}</p>
          </div>
          <ThemeToggle />
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm" className="w-full"><LogOut /> Keluar</Button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b-2 border-ink bg-card px-4 py-3 lg:hidden">
        <BrandMark sub="FARM CONSOLE" href="/admin" />
        <Button variant="outline" size="icon" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu /></Button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r-2 border-ink bg-card shadow-xl">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => setOpen(false)} aria-label="Tutup menu"><X /></Button>
            {content}
          </aside>
        </div>
      )}
      <aside className="hidden w-72 shrink-0 border-r-2 border-ink bg-card lg:block">
        <div className="sticky top-0 h-svh">{content}</div>
      </aside>
    </>
  );
}
