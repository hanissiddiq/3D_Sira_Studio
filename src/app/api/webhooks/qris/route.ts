import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyHmacSignature } from "@/lib/payments/signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Skema payload GENERIK. Petakan ke format asli penyedia QRIS Anda.
const payloadSchema = z.object({
  event_id: z.string().min(1).max(200),
  order_code: z.string().regex(/^SIRA-[A-F0-9]{8}$/),
  reference: z.string().max(200).optional(),
  status: z.enum(["paid", "expired", "failed"]),
  amount: z.number().int().nonnegative(),
});

export async function POST(request: Request) {
  const secret = process.env.QRIS_WEBHOOK_SECRET ?? "";
  const rawBody = await request.text(); // signature dihitung dari body mentah, bukan hasil parse

  if (!verifyHmacSignature(rawBody, request.headers.get("x-signature"), secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let json: unknown;
  try { json = JSON.parse(rawBody); } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
  }

  const p = parsed.data;
  const admin = createAdminClient();
  const { data: result, error } = await admin.rpc("process_payment_event", {
    p_event_id: p.event_id,
    p_order_code: p.order_code,
    p_reference: p.reference ?? null,
    p_status: p.status,
    p_amount: p.amount,
    p_payload: json as Record<string, unknown>,
  });

  if (error) {
    console.error("process_payment_event failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 }); // 5xx => provider mencoba ulang
  }

  if (result === "amount_mismatch" || result === "order_cancelled" || result === "order_not_found") {
    console.warn(`[qris-webhook] ${result} order=${p.order_code} event=${p.event_id}`);
  }
  // 200 untuk semua hasil yang sudah ditangani (termasuk duplicate) agar tidak di-retry terus.
  return NextResponse.json({ ok: true, result });
}
