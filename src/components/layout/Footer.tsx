import Link from "next/link";
import { getFleetSummary } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";
import { BrandMark } from "./BrandMark";

const PAYMENTS = ["QRIS", "BCA", "MANDIRI", "GOPAY", "SHOPEEPAY"];
const COURIERS = ["JNE Regular", "SiCepat Cargo", "Paxel Sameday"];
const MATERIAL_DOTS = ["bg-primary", "bg-secondary", "bg-accent", "bg-powder", "bg-peach"];

export async function Footer() {
  const [d, fleet] = await Promise.all([getDict(), getFleetSummary()]);
  const f = d.footer;
  const navLinks = ["/product", "/product", "/shop", "/gifts", "/orders"];
  return (
    <footer className="mt-12 border-t-2 border-ink bg-card">
      {fleet && (
        <div className="border-b-2 border-ink bg-powder">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <span className="h-2.5 w-2.5 rounded-full border border-ink bg-secondary" />
            <span className="font-bold">{d.landing.telemetry}</span>
            <span className="font-label">{d.landing.telemetryUnits(fleet.active, fleet.total)}</span>
          </div>
        </div>
      )}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <BrandMark />
          <p className="text-sm text-muted-foreground">{f.about}</p>
          <p className="font-label text-xs font-bold text-primary">● {f.precision}</p>
        </div>
        <div>
          <h3 className="mb-3 font-bold">{f.quickNav}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {f.links.map((label, i) => <li key={label}><Link href={navLinks[i]} className="hover:text-foreground hover:underline">{label}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-bold">{f.materials}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {f.mats.map((m, i) => (
              <li key={m} className="flex items-start gap-2"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${MATERIAL_DOTS[i]}`} />{m}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="font-bold">{f.security}</h3>
          <p className="text-sm text-muted-foreground">{f.securityText}</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENTS.map((p) => <span key={p} className="rounded-full bg-powder px-3 py-1 font-label text-xs font-bold">{p}</span>)}
          </div>
          <p className="font-label text-xs font-bold">{f.logistics}</p>
          <p className="text-sm text-muted-foreground">{COURIERS.join(" • ")}</p>
        </div>
      </div>
      <div className="border-t border-ink/20">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} {f.copy}</span>
          <span className="flex gap-4 font-bold text-primary"><span>{f.privacy}</span><span>{f.warranty}</span><span>{f.terms}</span></span>
        </div>
      </div>
    </footer>
  );
}
