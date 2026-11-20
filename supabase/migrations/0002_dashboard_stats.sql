-- Agregasi dashboard. SECURITY INVOKER: RLS tetap berlaku (hanya staff yang melihat angka).
create or replace function public.admin_dashboard_stats()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'pending_payment', count(*) filter (where status = 'pending_payment'),
    'to_process',      count(*) filter (where status = 'paid'),
    'in_production',   count(*) filter (where status = 'in_production'),
    'to_ship',         count(*) filter (where status = 'in_production' and tracking_number is null),
    'revenue_month',   coalesce(sum(total) filter (
                         where payment_status = 'paid'
                         and created_at >= date_trunc('month', now())), 0)
  )
  from public.orders
$$;
revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
