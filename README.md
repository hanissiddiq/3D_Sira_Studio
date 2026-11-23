# Sira 3D Studio — Platform Cetak 3D Custom & Ready Stock

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Supabase (Auth, Postgres + RLS, Storage) · three.js (react-three-fiber).
Tampilan mengikuti rancangan **Pastel Workshop Studio** (pastel kartun: outline arang, bayangan offset keras, font Plus Jakarta Sans + Space Grotesk).

## Menjalankan
```bash
npm install
cp .env.example .env.local        # isi URL & key Supabase, QRIS_WEBHOOK_SECRET
npm run dev                        # http://localhost:3000
npm run build && npm start         # produksi
```

### Database (urut)
Jalankan semua file di `supabase/migrations/` berurutan (SQL Editor atau `supabase db push`):
`0001_init` → `0002_dashboard_stats` → `0003_checkout_payments` → `0004_order_status` → `0005_upload_hardening`
→ `0006_product_kind` → `0007_workshop_schema` → `0008_workshop_functions` → `0009_doku_payments`.
Opsional: `supabase/seed.sql` (printer & material contoh).

Admin pertama: buat user di Supabase Auth, lalu di SQL Editor:
```sql
update public.profiles set role = 'admin' where id = '<UUID_USER>';
```
Operator: role `operator`. Akun lain (`customer`) tidak punya akses dashboard.

## Peta rancangan → aplikasi
| Rancangan | Rute | Data |
|---|---|---|
| Storefront Landing Page | `/` | produk custom/ready, galeri, ulasan, tier diskon, armada (nyata dari database) |
| 3D Customizer | `/product`, `/product/[slug]` | three.js: warna, teks, logo, snapshot |
| Ready Stock | `/shop`, `/shop/[slug]` | stok dikurangi atomik saat checkout |
| Papan Antrean Cetak | `/admin` | pesanan per tahap (Validasi → Cetak → QC → Packing) |
| Farm Fleet Live | `/admin/fleet` | tabel `printers` |
| Slicing & Validasi | `/admin/slicing` | checklist pra-cetak, parameter, pilih printer, mulai cetak |
| Manajemen Material | `/admin/materials` | stok filamen berkurang otomatis |
| Logistik & Kirim | `/admin/logistics` | resi termal (barcode CODE128, cetak), scanner, dispatch |
| Pengaturan | `/admin/settings` | tier diskon grosir |
| (tambahan) | `/admin/orders`, `/admin/products`, `/admin/gallery`, `/admin/reviews` | CRUD katalog, galeri, moderasi ulasan |

Alur status pesanan: `pending_payment → paid (webhook QRIS) → in_production → qc_finishing → packing → shipped → completed`.
Bahasa (ID/EN) & tema terang/gelap di navbar; teks storefront ada di `src/lib/i18n/dictionaries.ts`.

## Bagian rancangan yang BELUM/TIDAK diimplementasikan
Rancangan memuat fitur mesin/IoT yang butuh perangkat keras atau layanan pihak ketiga; ini tidak dibuat agar tidak menampilkan data palsu:
- Telemetri mesin real-time (MQTT, suhu nozzle/bed, AI Lidar/first-layer, kamera CCTV) — progres cetak di aplikasi adalah **estimasi** dari durasi yang diinput.
- Viewer G-code/toolpath 3D, slicer otomatis, auto-orientasi / repair mesh, upload file STL pelanggan, Multi-Plate Arranger.
- WhatsApp webhook/notifikasi, Request Pickup API kurir, integrasi tarif/resi kurir (ongkir masih tarif placeholder di `src/services/shippingService.ts`).
- Rate limit (checkout, lookup pesanan, upload) dan pembersihan file upload yatim.

## Catatan teknis
- Harga, ongkir, diskon, dan stok **selalu dihitung ulang di server** (`pricingService`, RPC `create_order`); data keranjang di browser hanya estimasi.
- RLS aktif di semua tabel; pembeli tamu tidak punya akses langsung ke `orders`. Operasi tamu lewat server (service role) dan RPC `security definer` yang hanya bisa dipanggil `service_role`.
- Upload logo/snapshot pelanggan memakai signed upload URL (bucket privat); staf melihatnya lewat signed URL 5 menit.
- Opsional env: `NEXT_PUBLIC_WHATSAPP_NUMBER` (tombol konsultasi grosir), `NEXT_PUBLIC_STUDIO_ADDRESS` (alamat pengirim di label resi), `SHIPPING_ORIGIN_PROVINCE`.
- Tipe database: `npx supabase gen types typescript --project-id <id> > src/types/database.ts` lalu pasang ke klien Supabase untuk pengecekan tipe yang lebih ketat.

## Pembayaran DOKU (Checkout)
Alur: checkout membuat pesanan (`pending_payment`) → server memanggil `POST /checkout/v1/payment` → halaman pembayaran DOKU tampil sebagai **popup** di atas situs (`DOKU_CHECKOUT_MODE=redirect` untuk pindah halaman)
(default hanya **QRIS**) → DOKU mengirim HTTP Notification ke `/api/webhooks/doku` → pesanan menjadi `paid`.

Setup:
1. Isi `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `DOKU_ENV` (`sandbox` / `production`), `NEXT_PUBLIC_SITE_URL` di `.env.local` / environment hosting.
2. DOKU Dashboard → atur **Notification URL** ke `https://<domain-anda>/api/webhooks/doku` (Request-Target signature = path ini).
   Pastikan layanan QRIS (atau metode lain di `DOKU_PAYMENT_METHODS`) sudah aktif di akun DOKU.
3. Jadwalkan `GET https://<domain-anda>/api/cron/expire-orders` tiap ±15 menit dengan header `Authorization: Bearer $CRON_SECRET`
   (Vercel Cron, Supabase pg_cron + pg_net, atau scheduler eksternal). Job ini membatalkan pesanan yang lewat batas bayar,
   mengembalikan stok, dan **mengecek ke DOKU dulu** sehingga pembayaran yang terlambat tidak ikut dibatalkan.

Perilaku penting:
- Verifikasi signature `HMACSHA256` (Client-Id, Request-Id, Request-Timestamp, Request-Target, Digest) dengan perbandingan waktu-konstan; Client-Id harus sama.
- Sesuai panduan DOKU untuk Checkout, notifikasi `FAILED` **diabaikan** (pelanggan boleh mencoba metode lain); hanya `SUCCESS` dan `EXPIRED` yang diproses.
- Pemrosesan idempoten (`payment_events`), nominal notifikasi harus sama dengan total pesanan, pembayaran untuk pesanan yang sudah dibatalkan dicatat sebagai peringatan (perlu refund manual).
- Pelanggan dapat menekan **Bayar sekarang** / **Saya sudah bayar, cek status** di halaman Lacak Pesanan (Check Status API sebagai cadangan notifikasi).
- Setiap percobaan pembayaran memakai invoice `SIRA-XXXXXXXX`, lalu `SIRA-XXXXXXXX-2`, dst. (maks. 5) agar tidak bentrok di DOKU.
- Belum ada: refund via API DOKU, dan pembuatan kode QR di halaman sendiri (QRIS ditampilkan di halaman DOKU).

Catatan popup: memakai `jokul-checkout-1.0.0.js` (sandbox: `sandbox.doku.com`, produksi: `jokul.doku.com`). Jika skrip gagal dimuat
(diblokir ekstensi/jaringan/CSP) aplikasi otomatis berpindah ke halaman DOKU. Jika situs Anda memakai Content-Security-Policy,
izinkan domain DOKU di `script-src`, `frame-src`, dan `connect-src`.
Jika tautan pembayaran gagal dibuat, layar checkout menampilkan penyebabnya (detail teknis hanya di mode pengembangan) dan tombol coba lagi;
log server memuat baris `ensurePaymentLink:` dengan respons DOKU.
