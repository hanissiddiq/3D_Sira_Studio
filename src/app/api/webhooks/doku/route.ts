import { NextResponse } from "next/server";
import { z } from "zod";
import { DokuError, verifyNotification } from "@/lib/doku/client";
import { applyPaymentResult } from "@/services/paymentService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Parse non-strict: field baru dari DOKU diabaikan, tidak membuat gagal
const notificationSchema = z.object({
  order: z.object({ invoice_number: z.string().min(1).max(80), amount: z.union([z.number(), z.string()]) }),
  transaction: z.object({
    status: z.string(), original_request_id: z.string().optional(), date: z.string().optional(),
  }),
  channel: z.object({ id: z.string().optional() }).optional(),
});

/**
 * HTTP Notification DOKU. Atur "Notification URL" di DOKU Dashboard ke:
 *   https://<domain-anda>/api/webhooks/doku
 * Request-Target pada signature = path URL ini.
 */
export async function POST(request: Request) {
  const rawBody = await request.text(); // Digest dihitung dari body mentah

  let verified;
  try {
    verified = verifyNotification({ headers: request.headers, rawBody, path: new URL(request.url).pathname });
  } catch (e) {
    if (e instanceof DokuError && e.kind === "config") {
      console.error("[doku-webhook] kredensial belum diatur");
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    throw e;
  }
  if (!verified) return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 400 }); // DOKU: balas 400 jika signature salah

  let json: unknown;
  try { json = JSON.parse(rawBody); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const parsed = notificationSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });

  const n = parsed.data;
  const status = n.transaction.status.toUpperCase();
  // Checkout membolehkan pelanggan mengganti metode bila gagal => abaikan FAILED (anjuran DOKU).
  const mapped = status === "SUCCESS" ? "paid" : status === "EXPIRED" ? "expired" : null;
  if (!mapped) return NextResponse.json({ ok: true, result: "ignored" });

  try {
    const result = await applyPaymentResult({
      eventId: `doku:${verified.requestId}`, invoice: n.order.invoice_number, status: mapped,
      amount: Math.round(Number(n.order.amount)),
      reference: [n.channel?.id, n.transaction.original_request_id].filter(Boolean).join(":") || null,
      payload: json,
    });
    if (["amount_mismatch", "order_cancelled", "order_not_found", "unknown_invoice"].includes(result)) {
      console.warn(`[doku-webhook] ${result} invoice=${n.order.invoice_number} request=${verified.requestId}`);
    }
    return NextResponse.json({ ok: true, result }); // 2xx untuk semua hasil yang sudah ditangani
  } catch (e) {
    console.error("[doku-webhook] gagal memproses:", e);
    return NextResponse.json({ ok: false }, { status: 500 }); // 5xx => DOKU mengirim ulang
  }
}
