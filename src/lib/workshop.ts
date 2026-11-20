export const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

/** Progres cetak dihitung dari waktu mulai & estimasi durasi (bukan telemetri mesin). */
export function printProgress(startedAt: string | null | undefined, estMinutes: number | null | undefined) {
  if (!startedAt || !estMinutes) return null;
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 60000;
  return {
    pct: Math.max(0, Math.min(100, Math.round((elapsed / estMinutes) * 100))),
    remaining: Math.max(0, Math.round(estMinutes - elapsed)),
  };
}

export function formatMinutes(m: number) {
  const h = Math.floor(m / 60), mm = m % 60;
  return h ? `${h}j ${mm}m` : `${mm}m`;
}

export const isExpress = (courier: string | null | undefined) => !!courier && courier.toLowerCase().includes("ekspres");
