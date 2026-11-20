-- custom = dirancang pelanggan lewat customizer 3D (/product); ready = produk siap beli (/shop)
alter table public.products
  add column if not exists kind text not null default 'custom' check (kind in ('custom', 'ready'));
create index if not exists products_kind_idx on public.products (is_active, kind);
