-- =========================================================
-- Checkout & pembayaran QRIS
-- =========================================================
alter table public.products
  add column if not exists weight_grams integer not null default 200 check (weight_grams > 0);

-- Log event pembayaran: idempotensi webhook (provider bisa kirim event yang sama berulang)
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  order_code text not null,
  status text not null,
  amount integer not null,
  result text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index payment_events_order_idx on public.payment_events (order_code);
alter table public.payment_events enable row level security;
create policy "staff read payment events" on public.payment_events for select to authenticated
  using (public.is_staff());

-- ---------- create_order: atomik (order + items + history dalam satu transaksi) ----------
create or replace function public.create_order(
  p_customer jsonb, p_shipping jsonb, p_courier text,
  p_subtotal integer, p_discount integer, p_shipping_cost integer, p_items jsonb
) returns table (out_order_id uuid, out_code text, out_total integer)
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid; v_code text; v_total integer;
begin
  v_total := p_subtotal - p_discount + p_shipping_cost;
  if v_total < 0 or jsonb_array_length(p_items) = 0 then
    raise exception 'invalid order';
  end if;

  insert into public.orders (customer_name, customer_email, customer_phone,
    shipping_address, courier, subtotal, discount, shipping_cost, total)
  values (p_customer ->> 'name', p_customer ->> 'email', p_customer ->> 'phone',
    p_shipping, p_courier, p_subtotal, p_discount, p_shipping_cost, v_total)
  returning public.orders.id, public.orders.order_code into v_id, v_code;

  insert into public.order_items (order_id, product_id, product_name, quantity,
    unit_price, customization, snapshot_path)
  select v_id, (i ->> 'productId')::uuid, i ->> 'productName', (i ->> 'quantity')::integer,
    (i ->> 'unitPrice')::integer, coalesce(i -> 'customization', '{}'::jsonb),
    i -> 'customization' ->> 'snapshotPath'
  from jsonb_array_elements(p_items) as i;

  insert into public.order_status_history (order_id, status, note)
  values (v_id, 'pending_payment', 'Pesanan dibuat');

  return query select v_id, v_code, v_total;
end $$;

-- ---------- process_payment_event: idempoten, validasi nominal ----------
create or replace function public.process_payment_event(
  p_event_id text, p_order_code text, p_reference text,
  p_status text, p_amount integer, p_payload jsonb
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_result text;
begin
  insert into public.payment_events (event_id, order_code, status, amount, payload)
  values (p_event_id, p_order_code, p_status, p_amount, p_payload)
  on conflict (event_id) do nothing;
  if not found then return 'duplicate'; end if;

  select * into v_order from public.orders where order_code = p_order_code for update;
  if not found then
    v_result := 'order_not_found';
  elsif v_order.payment_status = 'paid' then
    v_result := 'already_paid';
  elsif p_status = 'paid' then
    if p_amount <> v_order.total then
      v_result := 'amount_mismatch';          -- jangan tandai lunas
    elsif v_order.status = 'cancelled' then
      v_result := 'order_cancelled';          -- perlu ditangani manual (refund)
    else
      update public.orders
         set payment_status = 'paid', status = 'paid', paid_at = now(),
             qris_reference = coalesce(p_reference, qris_reference)
       where id = v_order.id;
      insert into public.order_status_history (order_id, status, note)
      values (v_order.id, 'paid', 'Pembayaran QRIS terkonfirmasi');
      v_result := 'paid';
    end if;
  elsif p_status in ('expired', 'failed') then
    update public.orders
       set payment_status = p_status::public.payment_status, status = 'cancelled'
     where id = v_order.id;
    insert into public.order_status_history (order_id, status, note)
    values (v_order.id, 'cancelled', 'Pembayaran ' || p_status);
    v_result := p_status;
  else
    v_result := 'ignored';
  end if;

  update public.payment_events set result = v_result where event_id = p_event_id;
  return v_result;
end $$;

revoke all on function public.create_order(jsonb, jsonb, text, integer, integer, integer, jsonb) from public, anon, authenticated;
revoke all on function public.process_payment_event(text, text, text, text, integer, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb, text, integer, integer, integer, jsonb) to service_role;
grant execute on function public.process_payment_event(text, text, text, text, integer, jsonb) to service_role;
