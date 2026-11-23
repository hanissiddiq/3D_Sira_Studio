"use client";

/**
 * Menampilkan DOKU Checkout sebagai popup (modal overlay) lewat jokul-checkout-1.0.0.js,
 * atau redirect biasa. Bila SDK gagal dimuat (diblokir/timeout), otomatis jatuh ke redirect
 * agar pelanggan tetap bisa membayar.
 */
declare global {
  interface Window { loadJokulCheckout?: (paymentUrl: string) => void }
}

export interface PaymentPresentation { url: string; mode: "popup" | "redirect"; sdkUrl: string | null }

let sdkPromise: Promise<void> | null = null;

function loadSdk(src: string) {
  if (typeof window.loadJokulCheckout === "function") return Promise.resolve();
  sdkPromise ??= new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src; el.async = true;
    el.onload = () => resolve();
    el.onerror = () => { sdkPromise = null; el.remove(); reject(new Error("DOKU SDK gagal dimuat")); };
    document.head.appendChild(el);
  });
  return sdkPromise;
}

export async function openDokuPayment(p: PaymentPresentation): Promise<"popup" | "redirect"> {
  if (p.mode === "popup" && p.sdkUrl) {
    try {
      await Promise.race([
        loadSdk(p.sdkUrl),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000)),
      ]);
      if (typeof window.loadJokulCheckout === "function") {
        window.loadJokulCheckout(p.url);
        return "popup";
      }
    } catch (e) {
      console.warn("[doku] popup tidak tersedia, memakai redirect:", e);
    }
  }
  window.location.assign(p.url);
  return "redirect";
}
