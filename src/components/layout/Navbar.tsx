import Link from "next/link";
import { Box, Menu, PackageSearch, Search, Sparkles } from "lucide-react";
import { CartButton } from "./CartButton";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#5b78e6] text-white shadow-[0_4px_0_#1e315f] transition-transform group-hover:-translate-y-0.5">
            <Box className="h-6 w-6" />
          </span>
          <span>
            <span className="flex items-center gap-1 text-lg font-black leading-none tracking-tight text-slate-900">
              SIRA <span className="text-[#5b78e6]">3D</span><Sparkles className="h-4 w-4 text-amber-400" />
            </span>
            <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.18em] text-[#5b78e6]">Pastel Studio Fun</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          <Link href="/" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white">Beranda</Link>
          <Link href="/product" className="rounded-full px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950">Studio 3D</Link>
          <Link href="/product" className="rounded-full px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950">Katalog</Link>
          <Link href="/orders" className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"><PackageSearch className="h-4 w-4" />Lacak</Link>
        </nav>

        <div className="flex items-center gap-2">
          <label className="hidden xl:flex h-10 w-56 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-slate-400">
            <Search className="h-4 w-4" />
            <input className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" placeholder="Cari produk custom" />
          </label>
          <CartButton />
          <button className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700 lg:hidden" aria-label="Buka menu" type="button"><Menu className="h-5 w-5" /></button>
        </div>
      </div>
    </header>
  );
}
