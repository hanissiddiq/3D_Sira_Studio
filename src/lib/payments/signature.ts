import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * HMAC-SHA256 hex atas RAW body. Header & algoritma bisa berbeda per penyedia
 * pembayaran: sesuaikan fungsi ini dengan dokumentasi penyedia yang dipakai.
 */
export function verifyHmacSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature.trim(), "hex");
  } catch {
    return false;
  }
  return received.length === expected.length && timingSafeEqual(received, expected);
}
