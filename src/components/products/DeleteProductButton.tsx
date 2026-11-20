"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProductAction } from "@/app/(dashboard)/admin/products/actions";

export function DeleteProductButton({ productId, name }: { productId: string; name: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    if (!window.confirm(`Hapus produk "${name}" beserta file-nya? Tindakan ini tidak dapat dibatalkan.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteProductAction(productId);
      if (res.ok) { router.push("/admin/products"); router.refresh(); }
      else setError(res.error);
    });
  };

  return (
    <div className="space-y-1">
      <Button type="button" variant="destructive" size="sm" onClick={onClick} disabled={isPending}>
        <Trash2 className="mr-2 h-4 w-4" /> Hapus produk
      </Button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
