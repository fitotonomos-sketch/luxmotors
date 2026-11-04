-- Add an audited, main-admin-only order deletion operation.
-- Affected tables: orders, order_items, audit_logs.
-- Order items use ON DELETE RESTRICT to preserve history by default; this
-- function explicitly removes a selected order's items in the same transaction.

create or replace function public.delete_order(p_order_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_admin_id uuid := auth.uid();
begin
  if v_admin_id is null or not public.has_admin_permission('admins.manage') then
    raise exception 'Only the main administrator can delete orders.';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found.';
  end if;

  delete from public.order_items where order_id = p_order_id;
  delete from public.orders where id = p_order_id;

  insert into public.audit_logs (admin_id, action, entity_type, entity_id, metadata)
  values (
    v_admin_id,
    'delete',
    'orders',
    p_order_id::text,
    jsonb_build_object('order_number', v_order.order_number)
  );

  return v_order.order_number;
end;
$$;

revoke execute on function public.delete_order(uuid) from public, anon, authenticated;
grant execute on function public.delete_order(uuid) to authenticated;
