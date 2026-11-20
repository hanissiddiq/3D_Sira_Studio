import Link from "next/link";
import { Box } from "lucide-react";

export function BrandMark({ sub = "PASTEL STUDIO FUN", href = "/" }: { sub?: string; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-ink bg-primary text-white shadow-cartoon">
        <Box className="h-6 w-6" strokeWidth={2.5} />
      </span>
      <span className="leading-none">
        <span className="block text-lg font-extrabold tracking-tight">SIRA <span className="text-primary">3D</span> ✨</span>
        <span className="font-label text-[10px] font-bold tracking-widest text-muted-foreground">{sub}</span>
      </span>
    </Link>
  );
}
