-- migration: create the house-dar product catalog and admin access list
-- affected tables: admins, products

create table public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category text not null,
  price numeric(12, 0) not null check (price >= 0),
  image_url text not null default '',
  stock integer not null default 0 check (stock >= 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_public_listing_idx on public.products (published, created_at desc);
create index products_category_idx on public.products (category);

alter table public.admins enable row level security;
alter table public.products enable row level security;

-- Signed-in users can read the allowlist; no client may mutate it.
create policy "Authenticated users can read admin list"
  on public.admins for select to authenticated using (true);

-- The public catalog exposes only published products.
create policy "Anyone can read published products"
  on public.products for select to anon, authenticated using (published = true);

-- An authenticated administrator may also inspect unpublished products.
create policy "Admins can read all products"
  on public.products for select to authenticated
  using ((select auth.jwt() ->> 'email') in (select email from public.admins));

create policy "Admins can insert products"
  on public.products for insert to authenticated
  with check ((select auth.jwt() ->> 'email') in (select email from public.admins));

create policy "Admins can update products"
  on public.products for update to authenticated
  using ((select auth.jwt() ->> 'email') in (select email from public.admins))
  with check ((select auth.jwt() ->> 'email') in (select email from public.admins));

create policy "Admins can delete products"
  on public.products for delete to authenticated
  using ((select auth.jwt() ->> 'email') in (select email from public.admins));
