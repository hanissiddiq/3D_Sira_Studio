"use client";

import { useCallback, useRef } from "react";

export type CaptureRef = { current: (() => string | null) | null };

/** Tangkap tampilan 3D sebagai data URL PNG. Upload ke storage dilakukan di tahap checkout. */
export function use3DSnapshot() {
  const captureRef = useRef<(() => string | null) | null>(null) as CaptureRef;
  const capture = useCallback((): string | null => captureRef.current?.() ?? null, []);
  return { captureRef, capture };
}
