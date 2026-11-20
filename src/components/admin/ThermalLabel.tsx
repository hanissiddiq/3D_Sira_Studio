"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LabelData {
  orderCode: string; tracking: string | null; courier: string; consignee: string; phone: string;
  address: string; weightGrams: number | null; box: string | null; itemCount: number;
}

const SENDER = process.env.NEXT_PUBLIC_STUDIO_ADDRESS || "Sira 3D Studio";

export function ThermalLabel({ data }: { data: LabelData }) {
  const svg = useRef<SVGSVGElement>(null);
  const code = data.tracking || data.orderCode;

  useEffect(() => {
    if (!svg.current) return;
    try {
      JsBarcode(svg.current, code, { format: "CODE128", displayValue: true, height: 44, margin: 0, fontSize: 12, font: "monospace" });
    } catch (e) {
      console.error("barcode:", e);
    }
  }, [code]);

  return (
    <div className="space-y-3">
      {/* 100 x 150 mm; hanya elemen ini yang ikut tercetak (lihat @media print di globals.css) */}
      <div id="thermal-label" className="mx-auto w-[100mm] max-w-full space-y-2 border-2 border-black bg-white p-3 text-[11px] text-black shadow-cartoon">
        <div className="flex items-start justify-between border-b-2 border-black pb-2">
          <div><p className="text-sm font-extrabold">SIRA 3D STUDIO</p><p className="text-[9px]">FABRICATION & LOGISTICS HUB</p></div>
          <p className="text-right text-sm font-extrabold uppercase">{data.courier}</p>
        </div>
        <svg ref={svg} className="mx-auto block w-full" aria-label={`Barcode ${code}`} />
        <div className="grid grid-cols-2 gap-2 border-t-2 border-black pt-2">
          <div><p className="text-[9px] font-bold">PENERIMA</p><p className="font-bold">{data.consignee}</p><p className="leading-tight">{data.address}</p><p>Tel: {data.phone}</p></div>
          <div><p className="text-[9px] font-bold">PENGIRIM</p><p className="leading-tight">{SENDER}</p></div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t-2 border-black pt-2">
          <div><p className="text-[9px] font-bold">ORDER</p><p className="font-bold">{data.orderCode}</p></div>
          <div><p className="text-[9px] font-bold">BERAT</p><p className="font-bold">{data.weightGrams ? `${(data.weightGrams / 1000).toFixed(2)} KG` : "—"}</p></div>
          <div><p className="text-[9px] font-bold">ISI</p><p className="font-bold">{data.itemCount} item{data.box ? ` · ${data.box}` : ""}</p></div>
        </div>
        <p className="border-2 border-black bg-yellow-200 p-1 text-center text-[10px] font-bold">⚠ FRAGILE • HASIL CETAK 3D PRESISI • JANGAN DIBANTING</p>
      </div>
      <Button type="button" className="w-full" variant="secondary" onClick={() => window.print()}><Printer />Cetak Label Termal Aktif</Button>
    </div>
  );
}
