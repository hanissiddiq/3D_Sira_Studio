import "server-only";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Klien DOKU Checkout (non-SNAP). Sumber: developers.doku.com
 *  - POST /checkout/v1/payment            -> payment.url, token_id, expired_date
 *  - GET  /orders/v1/status/{invoice}     -> Check Status
 *  - Signature: HMACSHA256 base64 atas "Client-Id / Request-Id / Request-Timestamp / Request-Target / Digest"
 *    (Digest = base64(SHA-256(body)) hanya untuk POST; GET tanpa Digest)
 */

export class DokuError extends Error {
  constructor(public kind: "config" | "http" | "invalid", message: string, public status?: number) {
    super(message);
  }
}

export function dokuConfig() {
  const clientId = process.env.DOKU_CLIENT_ID;
  const secretKey = process.env.DOKU_SECRET_KEY;
  if (!clientId || !secretKey) throw new DokuError("config", "DOKU_CLIENT_ID / DOKU_SECRET_KEY belum diatur.");
  const production = process.env.DOKU_ENV === "production";
  return {
    clientId, secretKey,
    baseUrl: production ? "https://api.doku.com" : "https://api-sandbox.doku.com",
  };
}

export const digestOf = (body: string) => createHash("sha256").update(body).digest("base64");

export function buildSignature(p: {
  clientId: string; requestId: string; timestamp: string; target: string; digest?: string; secretKey: string;
}) {
  const lines = [
    `Client-Id:${p.clientId}`, `Request-Id:${p.requestId}`,
    `Request-Timestamp:${p.timestamp}`, `Request-Target:${p.target}`,
  ];
  if (p.digest) lines.push(`Digest:${p.digest}`); // tanpa "\n" di akhir string
  return "HMACSHA256=" + createHmac("sha256", p.secretKey).update(lines.join("\n")).digest("base64");
}

// ISO 8601 UTC tanpa milidetik, mis. 2020-08-11T08:45:42Z
const isoTimestamp = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

async function dokuFetch(method: "GET" | "POST", path: string, payload?: unknown) {
  const cfg = dokuConfig();
  const requestId = randomUUID();
  const timestamp = isoTimestamp();
  const body = payload === undefined ? undefined : JSON.stringify(payload); // string yang sama dipakai untuk Digest & dikirim
  const signature = buildSignature({
    clientId: cfg.clientId, requestId, timestamp, target: path, secretKey: cfg.secretKey,
    digest: body === undefined ? undefined : digestOf(body),
  });
  let res: Response;
  try {
    res = await fetch(cfg.baseUrl + path, {
      method, body, cache: "no-store", signal: AbortSignal.timeout(15_000),
      headers: {
        "Content-Type": "application/json", "Client-Id": cfg.clientId,
        "Request-Id": requestId, "Request-Timestamp": timestamp, Signature: signature,
      },
    });
  } catch (e) {
    throw new DokuError("http", `Tidak dapat menghubungi DOKU: ${e instanceof Error ? e.message : "unknown"}`);
  }
  const raw = await res.text().catch(() => "");
  let json: Record<string, any> | null = null;
  try { json = raw ? (JSON.parse(raw) as Record<string, any>) : null; } catch { /* bukan JSON */ }
  return { ok: res.ok, status: res.status, json, raw, requestId };
}

// "20240712104711" (yyyyMMddHHmmss, UTC+7) -> ISO dengan offset +07:00
function parseDokuExpiry(v: unknown): string | null {
  const m = typeof v === "string" ? /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(v) : null;
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+07:00` : null;
}

// customer.name hanya boleh huruf (maks 255)
const cleanName = (n: string) => n.replace(/[^A-Za-z\s]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100) || "Pelanggan";
// Format DOKU: {kode negara}{nomor}, mis. 6281122334455
export function normalizePhone(p: string) {
  const d = p.replace(/\D/g, "");
  return (d.startsWith("0") ? "62" + d.slice(1) : d).slice(0, 16);
}

/** Ambil semua teks pesan dari bentuk respons error DOKU yang berbeda-beda; jika tidak ada, tampilkan body mentah. */
function describeError(json: Record<string, any> | null, raw: string) {
  const out: string[] = [];
  const push = (v: unknown): void => {
    if (typeof v === "string" && v.trim()) out.push(v.trim());
    else if (Array.isArray(v)) v.forEach(push);
    else if (v && typeof v === "object") Object.values(v).forEach(push);
  };
  push(json?.error_messages); push(json?.message); push(json?.error); push(json?.errors);
  return out.length ? out.join("; ") : raw.trim().slice(0, 400) || "(respons kosong)";
}

export interface CreatePaymentInput {
  invoice: string; amount: number; callbackUrl: string; dueMinutes: number;
  methods: string[]; itemName: string;
  customer: { name: string; email: string; phone: string };
}

export async function createCheckoutPayment(i: CreatePaymentInput) {
  const payload = {
    order: {
      amount: i.amount, invoice_number: i.invoice, currency: "IDR",
      callback_url: i.callbackUrl, auto_redirect: true,
      // Satu baris item = total, agar selalu cocok dengan order.amount (diskon & ongkir sudah termasuk)
      line_items: [{ name: i.itemName, quantity: 1, price: i.amount }],
    },
    payment: { payment_due_date: i.dueMinutes, ...(i.methods.length ? { payment_method_types: i.methods } : {}) },
    customer: { name: cleanName(i.customer.name), email: i.customer.email, phone: normalizePhone(i.customer.phone) },
  };
  const res = await dokuFetch("POST", "/checkout/v1/payment", payload);
  const payment = res.json?.response?.payment;
  if (!res.ok || !payment?.url) {
    console.error(
      `[doku] create payment gagal status=${res.status} env=${dokuConfig().baseUrl}\n` +
      `  request: invoice=${i.invoice} amount=${i.amount} methods=${i.methods.join(",") || "(semua)"} callback=${i.callbackUrl}\n` +
      `  response: ${res.raw.slice(0, 1000)}`,
    );
    const hint = res.status === 401 || res.status === 403
      ? " — periksa DOKU_CLIENT_ID / DOKU_SECRET_KEY dan DOKU_ENV (kunci sandbox hanya untuk sandbox)"
      : "";
    throw new DokuError("http", `DOKU menolak pembuatan pembayaran (${res.status}): ${describeError(res.json, res.raw)}${hint}`, res.status);
  }
  return {
    url: String(payment.url), tokenId: String(payment.token_id ?? ""),
    expiresAt: parseDokuExpiry(payment.expired_date), requestId: res.requestId,
  };
}

export interface DokuStatus {
  status: string; // SUCCESS | PENDING | FAILED | EXPIRED | ... | NOT_FOUND
  amount: number | null; channel: string | null; originalRequestId: string | null;
}

/** Check Status API. Jangan dipanggil < 60 detik setelah pembayaran selesai (anjuran DOKU). */
export async function getOrderStatus(invoice: string): Promise<DokuStatus> {
  const res = await dokuFetch("GET", `/orders/v1/status/${invoice}`);
  if (res.status === 404) return { status: "NOT_FOUND", amount: null, channel: null, originalRequestId: null };
  if (!res.ok) throw new DokuError("http", `Check Status DOKU gagal (${res.status})`, res.status);
  const j = res.json ?? {};
  const amount = Number(j.order?.amount);
  return {
    status: String(j.transaction?.status ?? "UNKNOWN").toUpperCase(),
    amount: Number.isFinite(amount) ? Math.round(amount) : null,
    channel: j.channel?.id ?? null,
    originalRequestId: j.transaction?.original_request_id ?? null,
  };
}

/** Verifikasi Signature notifikasi HTTP dari DOKU. `path` = path URL notifikasi di sisi kita. */
export function verifyNotification(p: { headers: Headers; rawBody: string; path: string }) {
  const cfg = dokuConfig();
  const clientId = p.headers.get("client-id");
  const requestId = p.headers.get("request-id");
  const timestamp = p.headers.get("request-timestamp");
  const received = p.headers.get("signature");
  if (!clientId || !requestId || !timestamp || !received || clientId !== cfg.clientId) return null;

  const expected = buildSignature({
    clientId, requestId, timestamp, target: p.path, digest: digestOf(p.rawBody), secretKey: cfg.secretKey,
  });
  const a = Buffer.from(expected), b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b) ? { requestId } : null;
}
