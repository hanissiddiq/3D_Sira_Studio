import Link from "next/link";
import { ArrowRight, Box, Clock3, Package, QrCode, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const products = [
	{ name: "Namy Pop Keychain", price: "Rp 29.000", icon: "A", color: "bg-[#dbe7ff]", accent: "text-[#5b78e6]" },
	{ name: "Flexi Dragon Toy", price: "Rp 65.000", icon: "D", color: "bg-[#ffe3d5]", accent: "text-[#a95b38]" },
	{ name: "MagSafe Desk Stand", price: "Rp 48.000", icon: "M", color: "bg-[#daf7e9]", accent: "text-[#16836a]" },
	{ name: "Artisan Keycap", price: "Rp 39.000", icon: "K", color: "bg-[#eee5ff]", accent: "text-[#7456a8]" },
];

export default function HomePage() {
	return (
		<main>
			<section className="relative overflow-hidden bg-[#eef3ff] px-4 py-16 md:px-6 md:py-24">
				<div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#88f7d1]/40 blur-3xl" />
				<div className="pointer-events-none absolute right-0 top-20 h-96 w-96 rounded-full bg-[#ffcab0]/50 blur-3xl" />
				<div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.85fr]">
					<div className="max-w-2xl">
						<div className="mb-5 flex flex-wrap gap-2">
							<span className="rounded-full border border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-800 shadow-[0_3px_0_#172033]">MICRO-PRECISION 0.12MM</span>
							<span className="rounded-full border border-slate-900 bg-[#ffe6d7] px-3 py-1.5 text-xs font-black text-[#6f3718] shadow-[0_3px_0_#172033]">⚡ CETAK 24 JAM</span>
						</div>
						<h1 className="text-5xl font-black leading-[1.05] tracking-tight text-slate-950 md:text-7xl">
							Wujudkan ide jadi <span className="bg-gradient-to-r from-[#5879df] via-[#cf8061] to-[#16836a] bg-clip-text text-transparent">objek nyata</span> dalam 24 jam.
						</h1>
						<p className="mt-6 max-w-xl text-base font-medium leading-7 text-slate-600 md:text-lg">
							Kustomisasi gantungan kunci, nameplate, dudukan gadget, dan mainan 3D dengan pratinjau langsung, pembayaran QRIS, serta status produksi transparan.
						</p>
						<div className="mt-8 flex flex-wrap gap-3">
							<Button asChild size="lg" className="h-12 rounded-full border-2 border-slate-900 bg-[#6c93f5] px-6 text-base font-black shadow-[0_6px_0_#172033] hover:-translate-y-1">
								<Link href="/product"><Box className="h-5 w-5" />Mulai Desain 3D<ArrowRight className="h-5 w-5" /></Link>
							</Button>
							<Button asChild variant="outline" size="lg" className="h-12 rounded-full border-2 border-slate-900 bg-white px-5 text-base font-black shadow-[0_6px_0_#172033]">
								<Link href="#catalog"><Zap className="h-5 w-5 text-[#cf8061]" />Lihat Ready Stock</Link>
							</Button>
						</div>
						<div className="mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
							{[
								["4.9/5", "1.480+ ulasan"], ["24–48h", "cetak cepat"], ["Garansi", "cetak ulang"], ["QRIS", "bayar instan"],
							].map(([title, label]) => (
								<div key={title} className="rounded-2xl border border-slate-200 bg-white/85 p-3 shadow-sm">
									<div className="flex items-center gap-1 text-sm font-black text-slate-950"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{title}</div>
									<div className="mt-1 text-xs font-bold text-slate-500">{label}</div>
								</div>
							))}
						</div>
					</div>

					<div className="relative mx-auto w-full max-w-[560px] rounded-[30px] border-2 border-slate-900 bg-white p-3 shadow-[0_10px_0_#172033]">
						<div className="flex items-center justify-between rounded-t-[20px] border-b border-slate-200 px-3 pb-3">
							<div className="flex gap-1.5"><span className="h-3 w-3 rounded-full border border-slate-900 bg-[#ffb691]" /><span className="h-3 w-3 rounded-full border border-slate-900 bg-[#88f7d1]" /><span className="h-3 w-3 rounded-full border border-slate-900 bg-[#dae2ff]" /></div>
							<span className="rounded-full border border-slate-900 bg-[#88f7d1] px-3 py-1 text-[10px] font-black text-[#004d3b]">WEBGL AKTIF</span>
						</div>
						<div className="relative grid h-[390px] place-items-center overflow-hidden rounded-[22px] bg-[radial-gradient(circle,#ffffff_1.5px,transparent_1.5px)] [background-size:24px_24px]">
							<div className="absolute bottom-10 h-14 w-72 rounded-full bg-[#6c93f5]/25 blur-xl" />
							<div className="relative -rotate-2 rounded-2xl border-4 border-slate-900 bg-gradient-to-br from-[#b9caf9] to-[#edf1fb] px-8 py-9 shadow-[0_8px_0_#172033]">
								<div className="absolute -left-5 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-4 border-slate-900 bg-white shadow-[0_3px_0_#172033]"><span className="mx-auto mt-2 block h-3 w-3 rounded-full border-2 border-slate-900" /></div>
								<div className="text-2xl font-black tracking-[0.08em] text-[#5879df] md:text-3xl">ALEXA 3D</div>
							</div>
						</div>
						<div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
							<div><div className="text-xs font-bold text-slate-500">Harga custom model</div><div className="text-xl font-black text-slate-950">Rp 35.000</div></div>
							<Button asChild className="rounded-full border-2 border-slate-900 bg-[#88f7d1] font-black text-[#004d3b] shadow-[0_4px_0_#172033]"><Link href="/product">Buka Studio <ArrowRight className="h-4 w-4" /></Link></Button>
						</div>
					</div>
				</div>
			</section>

			<section id="catalog" className="px-4 py-16 md:px-6 md:py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-8 flex items-end justify-between gap-4">
						<div><span className="text-xs font-black uppercase tracking-[0.16em] text-[#5879df]">Pilihan terpopuler</span><h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">Siap dikustomisasi</h2></div>
						<Link href="/product" className="hidden items-center gap-1 text-sm font-black text-[#5879df] sm:flex">Lihat semua <ArrowRight className="h-4 w-4" /></Link>
					</div>
					<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
						{products.map((product) => (
							<article key={product.name} className="group overflow-hidden rounded-[24px] border-2 border-slate-900 bg-white shadow-[0_7px_0_#172033] transition-transform hover:-translate-y-1">
								<div className={`grid h-52 place-items-center ${product.color}`}><div className={`grid h-28 w-28 rotate-3 place-items-center rounded-[28px] border-4 border-slate-900 bg-white text-5xl font-black shadow-[0_7px_0_#172033] ${product.accent}`}>{product.icon}</div></div>
								<div className="p-5"><h3 className="font-black text-slate-950">{product.name}</h3><div className="mt-4 flex items-center justify-between"><span className="text-sm font-black text-slate-950">{product.price}</span><Button asChild size="sm" className="rounded-full border border-slate-900 bg-[#88f7d1] text-[#004d3b] font-black"><Link href="/product">Kustom</Link></Button></div></div>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className="border-y border-slate-200 bg-slate-950 px-4 py-14 text-white md:px-6">
				<div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
					{[
						[<QrCode className="h-6 w-6" />, "Guest checkout", "Scan QRIS dalam 10 detik tanpa membuat akun."],
						[<Clock3 className="h-6 w-6" />, "Produksi transparan", "Pantau antrean dan status mesin secara langsung."],
						[<Package className="h-6 w-6" />, "Kemasan aman", "Produk diperiksa dan dikemas dengan bubble wrap tebal."],
					].map(([icon, title, copy]) => (
						<div key={String(title)} className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#88f7d1]">{icon}</span><div><h3 className="font-black">{title as string}</h3><p className="mt-1 text-sm leading-6 text-slate-300">{copy as string}</p></div></div>
					))}
				</div>
			</section>

			<section className="px-4 py-16 md:px-6">
				<div className="mx-auto max-w-7xl rounded-[32px] border-2 border-slate-900 bg-[#fff7eb] p-6 shadow-[0_8px_0_#172033] md:p-10">
					<div className="grid items-center gap-8 lg:grid-cols-2">
						<div>
							<span className="rounded-full border border-slate-900 bg-[#cf8061] px-3 py-1 text-xs font-black text-white">DISKON BERTINGKAT</span>
							<h2 className="mt-5 text-3xl font-black text-slate-950 md:text-5xl">Pesan banyak, semakin hemat.</h2>
							<p className="mt-4 max-w-xl font-medium text-slate-600">Diskon otomatis mulai dari 10% untuk 10 pcs dan hingga 25% untuk pesanan grosir 50 pcs.</p>
						</div>
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							{[["1–9", "Normal"],["10–24","10%"],["25–49","15%"],["50+","25%"]].map(([qty, discount]) => (
								<div key={qty} className="rounded-2xl border-2 border-slate-900 bg-white p-4 text-center shadow-[0_4px_0_#172033]">
									<div className="text-xs font-bold text-slate-500">{qty} pcs</div>
									<div className="mt-1 text-xl font-black text-slate-950">{discount}</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
