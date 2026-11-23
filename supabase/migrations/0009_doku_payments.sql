-- Integrasi DOKU Checkout: tautan pembayaran, kedaluwarsa, percobaan ulang
alter table public.orders
  add column if not exists payment_provider text,
  add column if not exists payment_url text check (payment_url is null or char_length(payment_url) <= 1000),
  add column if not exists payment_expires_at timestamptz,
  add column if not exists payment_attempts integer not null default 0 check (payment_attempts between 0 and 20),
  add column if not exists payment_checked_at timestamptz;

-- Dipakai job pembatalan pesanan yang kedaluwarsa
create index if not exists orders_pending_expiry_idx
  on public.orders (payment_expires_at) where status = 'pending_payment';
