import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tier } from "@/lib/pricing";

export const getBulkTiers = cache(async (): Promise<Tier[]> => {
  const { data, error } = await createPublicClient()
    .from("bulk_discount_tiers").select("min_quantity, percent").order("min_quantity");
  if (error) { console.error("bulk tiers:", error); return []; }
  return data.map((t) => ({ min_quantity: t.min_quantity, percent: Number(t.percent) }));
});
