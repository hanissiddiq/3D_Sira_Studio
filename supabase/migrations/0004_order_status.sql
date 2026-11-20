-- Ubah status pesanan: atomik + validasi transisi + riwayat dalam satu transaksi.
-- SECURITY INVOKER: RLS tetap berlaku (hanya staff yang bisa update orders & insert history).
create or replace function public.update_order_status(
  p_order_id uuid,
  p_status   public.order_status,
  p_tracking text default null,
  p_note     text default null
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
    or (v_order.status = 'in_production'   and p_status in ('shipped', 'cancelled'))
    or (v_order.status = 'shipped'         and p_status = 'completed')
  ) then
    raise exception 'invalid_transition';
  end if;

  -- Membatalkan pesanan yang sudah dibayar (butuh refund manual) hanya untuk admin
  if p_status = 'cancelled' and v_order.payment_status = 'paid' and not public.is_admin() then
    raise exception 'admin_only_cancel';
  end if;

  if p_status = 'shipped' and coalesce(v_tracking, v_order.tracking_number) is null then
    raise exception 'tracking_required';
  end if;

  update public.orders
     set status = p_status,
         tracking_number = coalesce(v_tracking, tracking_number)
   where id = p_order_id;

  insert into public.order_status_history (order_id, status, note, changed_by)
  values (p_order_id, p_status, nullif(trim(coalesce(p_note, '')), ''), (select auth.uid()));
end $$;

revoke all on function public.update_order_status(uuid, public.order_status, text, text) from public, anon;
grant execute on function public.update_order_status(uuid, public.order_status, text, text) to authenticated;
