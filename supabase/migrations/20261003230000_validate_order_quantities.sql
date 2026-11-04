-- migration: reject duplicate product lines in a single checkout request
-- affected functions: create_order

create or replace function public.create_order(p_items jsonb, p_customer_name text, p_customer_phone text, p_address text, p_notes text, p_access_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(14,0) := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
begin
  if p_access_token is null or length(trim(coalesce(p_customer_name, ''))) < 2
    or length(trim(coalesce(p_customer_phone, ''))) < 5
    or length(trim(coalesce(p_address, ''))) < 8
    or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1
    or jsonb_array_length(p_items) > 50 then
    raise exception 'اطلاعات سفارش معتبر نیست.';
  end if;
  if exists (select 1 from jsonb_array_elements(p_items) as entries(value) group by value->>'product_id' having count(*) > 1) then
    raise exception 'سبد خرید دارای ردیف تکراری است.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_access_token::text, 0));
  select id, order_number into v_order_id, v_order_number from public.orders where access_token = p_access_token;
  if v_order_id is not null then
    return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'access_token', p_access_token);
  end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    if coalesce((v_item->>'quantity')::integer, 0) < 1 or (v_item->>'quantity')::integer > 99 then raise exception 'تعداد محصول معتبر نیست.'; end if;
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid and published = true for share;
    if not found then raise exception 'یکی از محصولات دیگر در دسترس نیست.'; end if;
    if v_product.stock < v_quantity then raise exception 'موجودی محصول % کافی نیست.', v_product.name; end if;
    v_subtotal := v_subtotal + v_product.price * v_quantity;
  end loop;
  v_order_number := 'HD-' || to_char(now() at time zone 'UTC', 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
  insert into public.orders (order_number, access_token, customer_name, customer_phone, address, notes, subtotal, total)
    values (v_order_number, p_access_token, trim(p_customer_name), trim(p_customer_phone), trim(p_address), coalesce(trim(p_notes), ''), v_subtotal, v_subtotal) returning id into v_order_id;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid and published = true for share;
    insert into public.order_items (order_id, product_id, product_title, unit_price, quantity, line_total)
      values (v_order_id, v_product.id, v_product.name, v_product.price, v_quantity, v_product.price * v_quantity);
  end loop;
  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'access_token', p_access_token);
end;
$$;
revoke execute on function public.create_order(jsonb, text, text, text, text, uuid) from public;
grant execute on function public.create_order(jsonb, text, text, text, text, uuid) to anon, authenticated;
