-- migration: create trusted checkout, historical order records, and payment settings
-- affected tables: orders, order_items, site_settings; functions: create_order, get_order_for_payment

create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  access_token uuid not null unique,
  customer_name text not null,
  customer_phone text not null,
  address text not null,
  notes text not null default '',
  subtotal numeric(14, 0) not null check (subtotal >= 0),
  total numeric(14, 0) not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending','processing','shipped','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','awaiting_review','paid','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  product_title text not null,
  unit_price numeric(14, 0) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(14, 0) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);
create index orders_created_at_idx on public.orders (created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);

create table public.site_settings (
  id integer primary key check (id = 1),
  bank_name text,
  account_holder text,
  card_number text,
  payment_instructions text,
  support_id text,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.site_settings enable row level security;

-- Public payment instructions are readable; only listed administrators can change them.
create policy "Public can read payment settings" on public.site_settings
  for select to anon, authenticated using (true);
create policy "Admins can update payment settings" on public.site_settings
  for update to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins))
  with check ((select auth.jwt() ->> 'email') in (select email from public.admins));

create policy "Admins can view all orders" on public.orders
  for select to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins));
create policy "Admins can update order statuses" on public.orders
  for update to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins))
  with check ((select auth.jwt() ->> 'email') in (select email from public.admins));
create policy "Admins can view order items" on public.order_items
  for select to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins));

-- Create orders only through this server-validated transaction. The browser supplies
-- product IDs and quantities, never prices; current published product rows are authoritative.
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

  -- A random client idempotency token ensures retries cannot create duplicates.
  perform pg_advisory_xact_lock(hashtextextended(p_access_token::text, 0));
  select id, order_number into v_order_id, v_order_number
    from public.orders where access_token = p_access_token;
  if v_order_id is not null then
    return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'access_token', p_access_token);
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    if coalesce((v_item->>'quantity')::integer, 0) < 1 or (v_item->>'quantity')::integer > 99 then
      raise exception 'تعداد محصول معتبر نیست.';
    end if;
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid and published = true for share;
    if not found then raise exception 'یکی از محصولات دیگر در دسترس نیست.'; end if;
    if v_product.stock < v_quantity then raise exception 'موجودی محصول % کافی نیست.', v_product.name; end if;
    v_subtotal := v_subtotal + v_product.price * v_quantity;
  end loop;

  v_order_number := 'HD-' || to_char(now() at time zone 'UTC', 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
  insert into public.orders (order_number, access_token, customer_name, customer_phone, address, notes, subtotal, total)
    values (v_order_number, p_access_token, trim(p_customer_name), trim(p_customer_phone), trim(p_address), coalesce(trim(p_notes), ''), v_subtotal, v_subtotal)
    returning id into v_order_id;

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

-- Order lookup is limited to the unguessable capability token returned at order creation.
create or replace function public.get_order_for_payment(p_order_id uuid, p_access_token uuid)
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object(
    'order', to_jsonb(o) - 'access_token',
    'items', coalesce((select jsonb_agg(jsonb_build_object('product_title', i.product_title, 'unit_price', i.unit_price, 'quantity', i.quantity, 'line_total', i.line_total)) from public.order_items i where i.order_id = o.id), '[]'::jsonb),
    'settings', (select to_jsonb(s) - 'id' from public.site_settings s where s.id = 1)
  )
  from public.orders o
  where o.id = p_order_id and o.access_token = p_access_token;
$$;
revoke execute on function public.get_order_for_payment(uuid, uuid) from public;
grant execute on function public.get_order_for_payment(uuid, uuid) to anon, authenticated;
