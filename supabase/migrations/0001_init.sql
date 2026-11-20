-- =========================================================
-- SIRA STUDIO CLONE — schema awal
-- =========================================================

-- ---------- ENUMS ----------
create type public.user_role     as enum ('admin', 'operator', 'customer');
create type public.order_status  as enum ('pending_payment','paid','in_production','shipped','completed','cancelled');
create type public.payment_status as enum ('unpaid','paid','expired','failed');
create type public.review_status as enum ('pending','approved','rejected');

-- ---------- UTIL ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Profil dibuat otomatis; role SELALU 'customer' (tanpa akses dashboard)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- ROLE HELPERS (dipakai di RLS) ----------
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_user_role() in ('admin','operator'), false)
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;
revoke all on function public.current_user_role(), public.is_staff(), public.is_admin() from public;
grant execute on function public.current_user_role(), public.is_staff(), public.is_admin() to anon, authenticated;

-- Cegah privilege escalation: hanya admin / service_role yang boleh ubah role
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     and not public.is_admin() then
    raise exception 'Tidak diizinkan mengubah role';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------- PRODUCTS ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null default 'general',
  name_id text not null,
  name_en text not null,
  description_id text,
  description_en text,
  base_price integer not null check (base_price >= 0),   -- Rupiah
  text_fee integer not null default 0 check (text_fee >= 0),
  logo_fee integer not null default 0 check (logo_fee >= 0),
  model_url text,                                         -- file .glb di storage
  images text[] not null default '{}',
  customizer_config jsonb not null default '{}'::jsonb,   -- warna, font, area teks/logo
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_active_idx on public.products (is_active, category);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------- BULK DISCOUNT ----------
create table public.bulk_discount_tiers (
  id uuid primary key default gen_random_uuid(),
  min_quantity integer not null unique check (min_quantity > 1),
  percent numeric(5,2) not null check (percent > 0 and percent <= 100)
);

-- ---------- GALLERY ----------
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  product_id uuid references public.products(id) on delete set null,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index gallery_published_idx on public.gallery_items (is_published, sort_order);

-- ---------- ORDERS (guest checkout, dibuat lewat server/service role) ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique
    default ('SIRA-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  customer_name  text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address jsonb not null,
  courier text,
  tracking_number text,
  subtotal integer not null check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  shipping_cost integer not null default 0 check (shipping_cost >= 0),
  total integer not null check (total >= 0),
  status public.order_status not null default 'pending_payment',
  payment_status public.payment_status not null default 'unpaid',
  qris_reference text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_email_idx  on public.orders (lower(customer_email));
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,            -- snapshot
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  customization jsonb not null default '{}'::jsonb,
  snapshot_path text,                    -- screenshot hasil 3D customizer
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index order_history_order_idx on public.order_status_history (order_id, created_at);

-- ---------- REVIEWS ----------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references public.order_items(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  reviewer_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index reviews_product_idx on public.reviews (product_id, status);

-- =========================================================
-- RLS
-- =========================================================
alter table public.profiles             enable row level security;
alter table public.products             enable row level security;
alter table public.bulk_discount_tiers  enable row level security;
alter table public.gallery_items        enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.reviews              enable row level security;

-- profiles
create policy "own profile select" on public.profiles for select to authenticated
  using ((select auth.uid()) = id or public.is_admin());
create policy "own profile update" on public.profiles for update to authenticated
  using ((select auth.uid()) = id or public.is_admin())
  with check ((select auth.uid()) = id or public.is_admin());

-- products (publik hanya yang aktif)
create policy "public read active products" on public.products for select to anon, authenticated
  using (is_active or public.is_staff());
create policy "staff insert products" on public.products for insert to authenticated
  with check (public.is_staff());
create policy "staff update products" on public.products for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "admin delete products" on public.products for delete to authenticated
  using (public.is_admin());

-- bulk discount
create policy "public read tiers" on public.bulk_discount_tiers for select to anon, authenticated
  using (true);  -- data publik (ditampilkan di BulkDiscountBanner)
create policy "admin manage tiers" on public.bulk_discount_tiers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- gallery
create policy "public read gallery" on public.gallery_items for select to anon, authenticated
  using (is_published or public.is_staff());
create policy "staff manage gallery" on public.gallery_items for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- orders: TANPA akses anon. Insert/lookup tamu lewat server (service role).
create policy "staff read orders" on public.orders for select to authenticated
  using (public.is_staff());
create policy "staff update orders" on public.orders for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "admin delete orders" on public.orders for delete to authenticated
  using (public.is_admin());

create policy "staff read order_items" on public.order_items for select to authenticated
  using (public.is_staff());
create policy "staff read order history" on public.order_status_history for select to authenticated
  using (public.is_staff());
create policy "staff insert order history" on public.order_status_history for insert to authenticated
  with check (public.is_staff() and changed_by = (select auth.uid()));

-- reviews: publik hanya yang approved; insert lewat server (verifikasi order)
create policy "public read approved reviews" on public.reviews for select to anon, authenticated
  using (status = 'approved' or public.is_staff());
create policy "staff moderate reviews" on public.reviews for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "admin delete reviews" on public.reviews for delete to authenticated
  using (public.is_admin());

-- =========================================================
-- STORAGE
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-assets',   'product-assets',   true,  52428800, array['image/png','image/jpeg','image/webp','model/gltf-binary','application/octet-stream']),
  ('customer-uploads', 'customer-uploads', false, 5242880,  array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('design-snapshots', 'design-snapshots', false, 5242880,  array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "staff manage product assets" on storage.objects for all to authenticated
  using (bucket_id = 'product-assets' and public.is_staff())
  with check (bucket_id = 'product-assets' and public.is_staff());
create policy "staff read customer files" on storage.objects for select to authenticated
  using (bucket_id in ('customer-uploads','design-snapshots') and public.is_staff());
-- Upload logo pelanggan dilakukan lewat server (signed upload URL), bukan policy anon.

-- Seed contoh tier diskon
insert into public.bulk_discount_tiers (min_quantity, percent) values (5, 5), (10, 10), (25, 15)
on conflict do nothing;
