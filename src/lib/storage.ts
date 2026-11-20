const BUCKET = "product-assets";

export function productAssetPrefix() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
}

/** Hanya URL dari bucket product-assets milik proyek ini yang diterima server. */
export function isProductAssetUrl(url: string) {
  return url.startsWith(productAssetPrefix()) && !url.includes("..");
}

export function productAssetPath(url: string) {
  return isProductAssetUrl(url) ? decodeURIComponent(url.slice(productAssetPrefix().length)) : null;
}
