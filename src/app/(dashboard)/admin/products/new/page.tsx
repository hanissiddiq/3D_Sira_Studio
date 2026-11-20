import type { Metadata } from "next";
import { ProductForm } from "@/components/products/ProductForm";
import { requirePermission } from "@/lib/auth";
import { EMPTY_PRODUCT } from "@/lib/validations/product";

export const metadata: Metadata = { title: "Tambah Produk" };

export default async function NewProductPage() {
  await requirePermission("products:write");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tambah produk</h1>
      <ProductForm mode="create" defaultValues={EMPTY_PRODUCT} />
    </div>
  );
}
