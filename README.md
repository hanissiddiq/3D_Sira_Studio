# Sira Studio Clone — Fondasi (Phase 1–3)

## Setup
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
npm i @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers server-only lucide-react
npm i three @react-three/fiber @react-three/drei zustand
npx shadcn@latest init
cp .env.example .env.local   # isi kredensial Supabase
```
Jalankan `supabase/migrations/0001_init.sql` (SQL Editor atau `supabase db push`), lalu buat user
admin pertama di Auth → Users dan promosikan lewat SQL Editor:
```sql
update public.profiles set role = 'admin' where id = '<UUID_USER>';
```
 jika gagal atau permission tidak izinkan ikuti panduan dibawah
 -- 1. Matikan semua trigger buatan user di tabel profiles
ALTER TABLE public.profiles DISABLE TRIGGER USER;

-- 2. Jalankan update role
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'adf6db3e-7b9a-41cd-b482-6795b90465f6';

Generate tipe: `npx supabase gen types typescript --project-id <id> > src/types/database.ts`

## Phase 4 — Login & Dashboard
```bash
npx shadcn@latest add button input label card
npm i clsx tailwind-merge   # jika belum terpasang oleh shadcn init
```
Jalankan juga `supabase/migrations/0002_dashboard_stats.sql`.
Menu Pesanan/Produk/Galeri/Ulasan masih 404 sampai halamannya dibuat.

## Phase 5 — Checkout & webhook QRIS
Jalankan `supabase/migrations/0003_checkout_payments.sql`. Tambahkan ke `.env.local`:
`QRIS_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, opsional `SHIPPING_ORIGIN_PROVINCE`.
- Webhook: `POST /api/webhooks/qris`, header `x-signature` = HMAC-SHA256 hex dari raw body.
  Sesuaikan `signature.ts` dan `payloadSchema` dengan penyedia QRIS yang dipakai.
- Tes lokal:
```bash
BODY='{"event_id":"evt-1","order_code":"SIRA-XXXXXXXX","status":"paid","amount":150000}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$QRIS_WEBHOOK_SECRET" -hex | sed 's/^.* //')
curl -X POST localhost:3000/api/webhooks/qris -H "x-signature: $SIG" -d "$BODY"
```

## Phase 6 — Pesanan admin
Jalankan `supabase/migrations/0004_order_status.sql`. Halaman: `/admin/orders` (filter, cari, paginasi)
dan `/admin/orders/[id]` (detail, snapshot desain, riwayat, ubah status + resi).
Alur status: pending_payment → paid (hanya via webhook) → in_production → shipped (wajib resi) → completed.
Pembatalan pesanan yang sudah dibayar hanya admin dan refund dilakukan manual di luar sistem.

## Phase 7 — CRUD produk, upload model, customizer 3D
```bash
npm i three @react-three/fiber @react-three/drei && npm i -D @types/three
```
Tidak ada migrasi baru (memakai bucket `product-assets` dan policy staff dari 0001).
- Admin: `/admin/products` (daftar), `/new`, `/[id]` (edit + hapus untuk admin). Upload `.glb` & foto langsung
  ke Storage dari browser memakai session staff; server hanya menerima URL dari bucket proyek ini.
- Storefront: `/product` dan `/product/[slug]` (customizer 3D dengan warna, teks, logo).
- Konfigurasi dekal (mesh, posisi, rotasi, skala) disetel lewat pratinjau langsung di form admin.

## Phase 8 — Keranjang, upload desain, checkout, lacak pesanan
```bash
npm i zustand
```
Jalankan `supabase/migrations/0005_upload_hardening.sql`. Hapus `src/app/page.tsx` bawaan create-next-app
(beranda sekarang di `src/app/(storefront)/page.tsx`).
- Keranjang disimpan di localStorage (`sira-cart-v1`); harga di keranjang hanya estimasi, server menghitung ulang.
- Upload logo & snapshot desain: server membuat path acak + token upload sekali pakai (bucket privat),
  server memverifikasi file ada sebelum membuat pesanan.
- Setelah pesanan dibuat, instruksi/QR pembayaran QRIS BELUM ditampilkan (menunggu penyedia QRIS dipilih).
