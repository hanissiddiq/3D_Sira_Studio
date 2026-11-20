-- =========================================================
-- Fungsi workshop (dipisah dari 0007 karena memakai nilai enum baru)
-- =========================================================

-- Kembalikan stok produk siap beli saat pesanan batal (idempoten oleh alur: batal hanya sekali)
create or replace function public.restock_order(p_order_id uuid)
returns void language sql security invoker set search_path = '' as $$
  update public.products p set stock = p.stock + oi.q
  from (select product_id, sum(quantity)::integer as q
          from public.order_items where order_id = p_order_id group by product_id) oi
  where oi.product_id = p.id and p.kind = 'ready' and p.stock is not null
$$;
revoke all on function public.restock_order(uuid) from public, anon;
grant execute on function public.restock_order(uuid) to authenticated, service_role;

-- ---------- create_order: + pengurangan stok atomik ----------
create or replace function public.create_order(
  p_customer jsonb, p_shipping jsonb, p_courier text,
  p_subtotal integer, p_discount integer, p_shipping_cost integer, p_items jsonb
) returns table (out_order_id uuid, out_code text, out_total integer)
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid; v_code text; v_total integer; v_item record;
begin
  v_total := p_subtotal - p_discount + p_shipping_cost;
  if v_total < 0 or jsonb_array_length(p_items) = 0 then
    raise exception 'invalid order';
  end if;

  -- Stok produk siap beli (stock null = tanpa batas). Gagal => seluruh transaksi dibatalkan.
  for v_item in
    select (i ->> 'productId')::uuid as pid, (i ->> 'quantity')::integer as qty
      from jsonb_array_elements(p_items) as i
  loop
    update public.products set stock = stock - v_item.qty
     where id = v_item.pid and kind = 'ready' and stock is not null and stock >= v_item.qty;
    if not found and exists (
      select 1 from public.products where id = v_item.pid and kind = 'ready' and stock is not null
    ) then
      raise exception 'out_of_stock';
    end if;
  end loop;

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

-- ---------- process_payment_event: + restock saat kedaluwarsa/gagal ----------
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
      v_result := 'amount_mismatch';
    elsif v_order.status = 'cancelled' then
      v_result := 'order_cancelled';
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
    if v_order.status <> 'cancelled' then
      update public.orders
         set payment_status = p_status::public.payment_status, status = 'cancelled'
       where id = v_order.id;
      insert into public.order_status_history (order_id, status, note)
      values (v_order.id, 'cancelled', 'Pembayaran ' || p_status);
      perform public.restock_order(v_order.id);
    end if;
    v_result := p_status;
  else
    v_result := 'ignored';
  end if;

  update public.payment_events set result = v_result where event_id = p_event_id;
  return v_result;
end $$;

-- ---------- update_order_status: alur produksi lengkap ----------
create or replace function public.update_order_status(
  p_order_id uuid, p_status public.order_status, p_tracking text default null, p_note text default null
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_order    public.orders%rowtype;
  v_tracking text := nullif(trim(coalesce(p_tracking, '')), '');
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;

  if not (
       (v_order.status = 'pending_payment' and p_status = 'cancelled')
    or (v_order.status = 'paid'            and p_status in ('in_production', 'cancelled'))
    or (v_order.status = 'in_production'   and p_status in ('qc_finishing', 'cancelled'))
    or (v_order.status = 'qc_finishing'    and p_status in ('packing', 'in_production', 'cancelled'))
    or (v_order.status = 'packing'         and p_status in ('shipped', 'cancelled'))
    or (v_order.status = 'shipped'         and p_status = 'completed')
  ) then
    raise exception 'invalid_transition';
  end if;

  if p_status = 'cancelled' and v_order.payment_status = 'paid' and not public.is_admin() then
    raise exception 'admin_only_cancel';
  end if;
  if p_status = 'shipped' and coalesce(v_tracking, v_order.tracking_number) is null then
    raise exception 'tracking_required';
  end if;

  update public.orders
     set status = p_status, tracking_number = coalesce(v_tracking, tracking_number)
   where id = p_order_id;

  insert into public.order_status_history (order_id, status, note, changed_by)
  values (p_order_id, p_status, nullif(trim(coalesce(p_note, '')), ''), (select auth.uid()));

  -- Efek samping workshop
  if v_order.status = 'in_production' and p_status = 'qc_finishing' then
    update public.printers set status = 'eject' where current_order_id = p_order_id and status = 'printing';
    update public.print_jobs set finished_at = now() where order_id = p_order_id;
  end if;
  if p_status = 'cancelled' then
    update public.printers set status = 'idle', current_order_id = null, current_label = null
     where current_order_id = p_order_id;
    perform public.restock_order(p_order_id);
  end if;
end $$;

-- ---------- start_print_job: validasi -> mulai cetak (atomik) ----------
create or replace function public.start_print_job(
  p_order_id uuid, p_printer_id uuid, p_material_id uuid,
  p_layer_height numeric, p_infill integer, p_est_minutes integer, p_est_grams integer,
  p_notes text, p_preflight jsonb
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_printer public.printers%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.status <> 'paid' then raise exception 'invalid_transition'; end if;

  select * into v_printer from public.printers where id = p_printer_id for update;
  if not found then raise exception 'printer_not_found'; end if;
  if v_printer.status <> 'idle' then raise exception 'printer_busy'; end if;

  if p_material_id is not null then
    update public.materials
       set stock_rolls = greatest(0, stock_rolls - (coalesce(p_est_grams, 0)::numeric / grams_per_roll))
     where id = p_material_id;
    if not found then raise exception 'material_not_found'; end if;
  end if;

  insert into public.print_jobs (order_id, printer_id, material_id, layer_height, infill_pct,
    est_minutes, est_grams, notes, preflight, started_at)
  values (p_order_id, p_printer_id, p_material_id, p_layer_height, p_infill,
    p_est_minutes, p_est_grams, nullif(trim(coalesce(p_notes, '')), ''), coalesce(p_preflight, '{}'::jsonb), now())
  on conflict (order_id) do update set
    printer_id = excluded.printer_id, material_id = excluded.material_id,
    layer_height = excluded.layer_height, infill_pct = excluded.infill_pct,
    est_minutes = excluded.est_minutes, est_grams = excluded.est_grams,
    notes = excluded.notes, preflight = excluded.preflight, started_at = now(), finished_at = null;

  update public.printers
     set status = 'printing', current_order_id = p_order_id, current_label = v_order.order_code
   where id = p_printer_id;

  perform public.update_order_status(p_order_id, 'in_production', null, 'Mulai cetak di ' || v_printer.name);
end $$;

revoke all on function public.update_order_status(uuid, public.order_status, text, text) from public, anon;
revoke all on function public.start_print_job(uuid, uuid, uuid, numeric, integer, integer, integer, text, jsonb) from public, anon;
grant execute on function public.update_order_status(uuid, public.order_status, text, text) to authenticated;
grant execute on function public.start_print_job(uuid, uuid, uuid, numeric, integer, integer, integer, text, jsonb) to authenticated;
revoke all on function public.create_order(jsonb, jsonb, text, integer, integer, integer, jsonb) from public, anon, authenticated;
revoke all on function public.process_payment_event(text, text, text, text, integer, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb, text, integer, integer, integer, jsonb) to service_role;
grant execute on function public.process_payment_event(text, text, text, text, integer, jsonb) to service_role;

-- ---------- dispatch_order: simpan data paket + tandai dikirim (atomik) ----------
create or replace function public.dispatch_order(
  p_order_id uuid, p_tracking text, p_weight integer, p_box text
) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  update public.orders
     set packed_weight_grams = p_weight, box_size = nullif(trim(coalesce(p_box, '')), '')
   where id = p_order_id and status = 'packing';
  if not found then raise exception 'invalid_transition'; end if;
  perform public.update_order_status(p_order_id, 'shipped', p_tracking, 'Diserahkan ke kurir');
end $$;
revoke all on function public.dispatch_order(uuid, text, integer, text) from public, anon;
grant execute on function public.dispatch_order(uuid, text, integer, text) to authenticated;
