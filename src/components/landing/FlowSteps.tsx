import { Eye, Gauge, Package, QrCode, ShieldCheck, SlidersHorizontal, Truck, Zap } from "lucide-react";
import { getDict } from "@/lib/i18n/server";

const STEP_STYLE = [
  { bg: "bg-powder", icon: SlidersHorizontal, iconBg: "bg-primary text-white", num: "text-primary/40", tagIcon: Eye, tag: "text-primary" },
  { bg: "bg-mint-soft", icon: QrCode, iconBg: "bg-mint text-on-pastel", num: "text-secondary/60", tagIcon: ShieldCheck, tag: "text-secondary-foreground dark:text-secondary" },
  { bg: "bg-peach-soft", icon: Zap, iconBg: "bg-peach text-on-pastel", num: "text-accent/70", tagIcon: Gauge, tag: "text-foreground" },
  { bg: "bg-lilac-soft", icon: Truck, iconBg: "bg-lilac text-on-pastel", num: "text-lilac/80", tagIcon: Package, tag: "text-primary" },
];

export async function FlowSteps() {
  const t = (await getDict()).landing;
  return (
    <section className="border-y-2 border-ink/15 bg-card/60">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="font-label text-xs font-bold text-primary">✦ {t.flowEyebrow}</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{t.flowTitle}</h2>
            <p className="max-w-xl text-muted-foreground">{t.flowSub}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-mint-soft px-4 py-2 font-label text-xs font-bold shadow-cartoon"><Zap className="h-3.5 w-3.5" />{t.flowAvg}</span>
        </div>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.steps.map((s, i) => {
            const st = STEP_STYLE[i], Icon = st.icon, TagIcon = st.tagIcon;
            return (
              <li key={s.title} className={`flex flex-col gap-3 rounded-xl border-2 border-ink p-5 shadow-cartoon ${st.bg}`}>
                <div className="flex items-start justify-between">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink ${st.iconBg}`}><Icon className="h-6 w-6" /></span>
                  <span className={`font-label text-sm font-bold ${st.num}`}>0{i + 1}</span>
                </div>
                <h3 className="font-bold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
                <p className={`mt-auto flex items-center gap-1.5 pt-2 font-label text-xs font-bold ${st.tag}`}><TagIcon className="h-3.5 w-3.5" />{s.tag}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
