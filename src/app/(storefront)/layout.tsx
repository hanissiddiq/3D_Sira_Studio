import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartHydrator } from "@/components/cart/CartHydrator";
import { Navbar } from "@/components/layout/Navbar";
import { getBulkTiers } from "@/lib/data";
import Link from "next/link";
import { Box } from "lucide-react";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const tiers = await getBulkTiers();
  return (
    <div className="flex min-h-svh flex-col">
      <CartHydrator />
      <Navbar />
      <div className="border-b border-slate-200 bg-white px-4 py-2 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 font-bold text-slate-700">
            <span className="shrink-0 rounded-full bg-[#cf8061] px-2.5 py-1 text-[10px] font-black uppercase text-white">Promo grosir</span>
            <span className="truncate">Diskon hingga 25% untuk pesanan 50 pcs</span>
          </div>
          <div className="hidden items-center gap-2 text-slate-500 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="font-bold">18 mesin aktif • Est. 18 jam</span></div>
        </div>
      </div>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-900 bg-[#6c93f5] text-white shadow-[0_3px_0_#172033]"><Box className="h-5 w-5" /></span>
              <span className="text-lg font-black text-slate-950">SIRA <span className="text-[#5879df]">3D</span></span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">Platform cetak 3D custom &amp; ready stock untuk aksesoris, merchandise, dan hadiah unik dengan cetakan presisi 0.12 mm.</p>
          </div>
          <div><h3 className="font-black text-slate-950">Navigasi</h3><div className="mt-3 flex flex-col gap-2 text-sm text-slate-500"><Link href="/product" className="hover:text-slate-950">Studio 3D</Link><Link href="/orders" className="hover:text-slate-950">Lacak pesanan</Link><Link href="/cart" className="hover:text-slate-950">Keranjang</Link></div></div>
          <div><h3 className="font-black text-slate-950">Pembayaran</h3><div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-700"><span className="rounded-full border border-slate-200 px-2.5 py-1">QRIS</span><span className="rounded-full border border-slate-200 px-2.5 py-1">BCA</span><span className="rounded-full border border-slate-200 px-2.5 py-1">GoPay</span></div></div>
        </div>
        <div className="border-t border-slate-200 px-4 py-5 text-center text-xs font-medium text-slate-500">© {new Date().getFullYear()} Sira 3D Studio Indonesia</div>
      </footer>
      <CartDrawer tiers={tiers} />
    </div>
  );
}
