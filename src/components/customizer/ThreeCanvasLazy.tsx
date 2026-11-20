"use client";

import dynamic from "next/dynamic";

// three.js butuh browser: dimuat hanya di client dan terpisah dari bundle awal.
export const ThreeCanvasLazy = dynamic(() => import("./ThreeCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-64 items-center justify-center text-sm text-muted-foreground">
      Memuat pratinjau 3D…
    </div>
  ),
});
