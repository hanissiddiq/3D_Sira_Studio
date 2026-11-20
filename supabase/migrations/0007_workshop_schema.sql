-- =========================================================
-- Workshop: armada printer, material, pekerjaan cetak, stok, kategori galeri
-- =========================================================
alter type public.order_status add value if not exists 'qc_finishing' after 'in_production';
alter type public.order_status add value if not exists 'packing' after 'qc_finishing';

alter table public.products add column if not exists stock integer check (stock is null or stock >= 0); -- null = tanpa batas / dibuat saat dipesan
alter table public.gallery_items add column if not exists category text check (category is null or char_length(category) <= 40);
alter table public.orders
  add column if not exists packed_weight_grams integer check (packed_weight_grams is null or packed_weight_grams > 0),
  add column if not exists box_size text check (box_size is null or char_length(box_size) <= 40);

-- ---------- printers ----------
create table public.printers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 40),
  model text not null default '' check (char_length(model) <= 80),
  nozzle text not null default '0.4mm' check (char_length(nozzle) <= 20),
  status text not null default 'idle' check (status in ('idle','printing','eject','maintenance','offline')),
  current_order_id uuid references public.orders(id) on delete set null,
  current_label text,
  created_at timestamptz not null default now()
);

-- ---------- materials ----------
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  type text not null default 'PLA' check (char_length(type) <= 30),
  color_name text not null default '' check (char_length(color_name) <= 40),
  color_hex text not null default '#cccccc' check (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  stock_rolls numeric(8,2) not null default 0 check (stock_rolls >= 0),
  grams_per_roll integer not null default 1000 check (grams_per_roll > 0),
  low_stock_rolls numeric(8,2) not null default 2 check (low_stock_rolls >= 0),
  cost_per_kg integer not null default 0 check (cost_per_kg >= 0),   -- Rupiah
  created_at timestamptz not null default now()
);

-- ---------- print_jobs: satu pekerjaan per pesanan ----------
create table public.print_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  printer_id uuid references public.printers(id) on delete set null,
  material_id uuid references public.materials(id) on delete set null,
  layer_height numeric(4,2) not null default 0.12 check (layer_height > 0 and layer_height <= 1),
  infill_pct integer not null default 25 check (infill_pct between 0 and 100),
  est_minutes integer check (est_minutes is null or est_minutes > 0),
  est_grams integer check (est_grams is null or est_grams > 0),
  notes text check (notes is null or char_length(notes) <= 500),
  preflight jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index print_jobs_printer_idx on public.print_jobs (printer_id);

alter table public.printers   enable row level security;
alter table public.materials  enable row level security;
alter table public.print_jobs enable row level security;

create policy "staff read printers"   on public.printers for select to authenticated using (public.is_staff());
create policy "staff insert printers" on public.printers for insert to authenticated with check (public.is_staff());
create policy "staff update printers" on public.printers for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "admin delete printers" on public.printers for delete to authenticated using (public.is_admin());

create policy "staff read materials"   on public.materials for select to authenticated using (public.is_staff());
create policy "staff insert materials" on public.materials for insert to authenticated with check (public.is_staff());
create policy "staff update materials" on public.materials for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "admin delete materials" on public.materials for delete to authenticated using (public.is_admin());

create policy "staff read print_jobs"   on public.print_jobs for select to authenticated using (public.is_staff());
create policy "staff insert print_jobs" on public.print_jobs for insert to authenticated with check (public.is_staff());
create policy "staff update print_jobs" on public.print_jobs for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- Ringkasan armada untuk strip telemetri publik (tanpa membuka tabel printers ke anon)
create or replace function public.fleet_summary()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'total',  count(*),
    'online', count(*) filter (where status <> 'offline'),
    'active', count(*) filter (where status in ('printing', 'eject'))
  ) from public.printers
$$;
revoke all on function public.fleet_summary() from public;
grant execute on function public.fleet_summary() to anon, authenticated;
