-- migration: add public cms, media library, banners, seo fields, and administrator audit trail
-- affected tables: products, admins, site_settings, media_assets, site_content, banners, categories, audit_logs

alter table public.admins add column role text not null default 'administrator' check (role in ('main','administrator'));
alter table public.products add column seo_title text, add column seo_description text, add column seo_image_path text, add column canonical_url text, add column robots text not null default 'index,follow';
alter table public.site_settings add column site_name text not null default 'خانه‌دار', add column contact_info jsonb not null default '{}'::jsonb, add column footer_content text not null default '', add column social_links jsonb not null default '{}'::jsonb, add column logo_path text, add column favicon_path text, add column og_image_path text, add column site_seo_title text, add column site_seo_description text, add column site_canonical_url text, add column robots_policy text not null default 'index,follow';

create table public.media_assets (id uuid primary key default gen_random_uuid(), storage_path text not null unique, original_name text not null, mime_type text not null, file_size bigint not null check (file_size > 0 and file_size <= 10485760), created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now());
alter table public.media_assets enable row level security;
create policy "Public can view registered media" on public.media_assets for select to anon, authenticated using (true);
create policy "Admins can register media" on public.media_assets for insert to authenticated with check ((select auth.jwt() ->> 'email') in (select email from public.admins));
create policy "Admins can delete media records" on public.media_assets for delete to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins));

create table public.site_content (id integer primary key check (id = 1), site_name text not null default 'خانه‌دار', tagline text not null default '', contact_info jsonb not null default '{}'::jsonb, footer_content text not null default '', social_links jsonb not null default '{}'::jsonb, logo_path text, favicon_path text, og_image_path text, seo_title text, seo_description text, canonical_url text, robots text not null default 'index,follow', updated_at timestamptz not null default now());
insert into public.site_content (id) values (1);
alter table public.site_content enable row level security;
create policy "Anyone can read site content" on public.site_content for select to anon, authenticated using (true);
create policy "Admins can update site content" on public.site_content for update to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins)) with check ((select auth.jwt() ->> 'email') in (select email from public.admins));

create table public.banners (id uuid primary key default gen_random_uuid(), title text not null, subtitle text not null default '', desktop_image text not null, mobile_image text, link text, animation_type text not null default 'fade' check (animation_type in ('fade','slide')), display_order integer not null default 0, is_active boolean not null default false, created_at timestamptz not null default now());
alter table public.banners enable row level security;
create policy "Anyone can view active banners" on public.banners for select to anon, authenticated using (is_active = true);
create policy "Admins can view all banners" on public.banners for select to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins));
create policy "Admins can create banners" on public.banners for insert to authenticated with check ((select auth.jwt() ->> 'email') in (select email from public.admins));
create policy "Admins can update banners" on public.banners for update to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins)) with check ((select auth.jwt() ->> 'email') in (select email from public.admins));
create policy "Admins can delete banners" on public.banners for delete to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins));

create table public.categories (id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, seo_title text, seo_description text, seo_image_path text, canonical_url text, robots text not null default 'index,follow', is_published boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.categories enable row level security;
create policy "Anyone can view published categories" on public.categories for select to anon, authenticated using (is_published = true);
create policy "Admins can view categories" on public.categories for select to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins));
create policy "Admins can create categories" on public.categories for insert to authenticated with check ((select auth.jwt() ->> 'email') in (select email from public.admins));
create policy "Admins can update categories" on public.categories for update to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins)) with check ((select auth.jwt() ->> 'email') in (select email from public.admins));
create policy "Admins can delete categories" on public.categories for delete to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins));

create table public.audit_logs (id uuid primary key default gen_random_uuid(), admin_id uuid references auth.users(id) on delete set null, action text not null, entity_type text not null, entity_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
alter table public.audit_logs enable row level security;
create policy "Main admins can view audit logs" on public.audit_logs for select to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins where role = 'main'));
create policy "Admins can record audit events" on public.audit_logs for insert to authenticated with check (admin_id = (select auth.uid()) and (select auth.jwt() ->> 'email') in (select email from public.admins));

-- Main administrators can manage administrator membership and roles.
create policy "Main admins can add administrators" on public.admins for insert to authenticated with check ((select auth.jwt() ->> 'email') in (select email from public.admins where role = 'main'));
create policy "Main admins can update administrators" on public.admins for update to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins where role = 'main')) with check ((select auth.jwt() ->> 'email') in (select email from public.admins where role = 'main'));
create policy "Main admins can remove administrators" on public.admins for delete to authenticated using ((select auth.jwt() ->> 'email') in (select email from public.admins where role = 'main'));

-- Public image media; uploads are restricted to an authenticated administrator's own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('site-media', 'site-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','image/x-icon','image/vnd.microsoft.icon','image/svg+xml']) on conflict (id) do nothing;
create policy "Admins upload site media" on storage.objects for insert to authenticated with check (bucket_id = 'site-media' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub') and (select auth.jwt() ->> 'email') in (select email from public.admins));
create policy "Admins update own site media" on storage.objects for update to authenticated using (bucket_id = 'site-media' and owner_id = (select auth.jwt() ->> 'sub') and (select auth.jwt() ->> 'email') in (select email from public.admins));
create policy "Admins delete own site media" on storage.objects for delete to authenticated using (bucket_id = 'site-media' and owner_id = (select auth.jwt() ->> 'sub') and (select auth.jwt() ->> 'email') in (select email from public.admins));

-- Log mutations with caller identity; metadata excludes settings values and payment credentials.
create or replace function public.capture_admin_audit()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_id text;
  v_action text;
  v_meta jsonb := '{}'::jsonb;
begin
  v_id := coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id');
  v_action := lower(tg_op);
  if tg_op = 'UPDATE' and tg_table_name = 'orders' then
    v_meta := jsonb_build_object('status', to_jsonb(new)->>'status', 'payment_status', to_jsonb(new)->>'payment_status');
  elsif tg_table_name = 'banners' then
    v_meta := jsonb_build_object('title', coalesce(to_jsonb(new)->>'title', to_jsonb(old)->>'title'));
  elsif tg_table_name = 'products' then
    v_meta := jsonb_build_object('name', coalesce(to_jsonb(new)->>'name', to_jsonb(old)->>'name'));
  elsif tg_table_name = 'admins' then
    v_meta := jsonb_build_object('email', coalesce(to_jsonb(new)->>'email', to_jsonb(old)->>'email'));
  end if;
  insert into public.audit_logs (admin_id, action, entity_type, entity_id, metadata)
    values ((select auth.uid()), v_action, tg_table_name, v_id, v_meta);
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
revoke execute on function public.capture_admin_audit() from public, anon, authenticated;
create trigger audit_products after insert or update or delete on public.products for each row execute function public.capture_admin_audit();
create trigger audit_orders after update on public.orders for each row execute function public.capture_admin_audit();
create trigger audit_banners after insert or update or delete on public.banners for each row execute function public.capture_admin_audit();
create trigger audit_settings after update on public.site_settings for each row execute function public.capture_admin_audit();
create trigger audit_site_content after update on public.site_content for each row execute function public.capture_admin_audit();
create trigger audit_admins after insert or update or delete on public.admins for each row execute function public.capture_admin_audit();
create trigger audit_categories after insert or update or delete on public.categories for each row execute function public.capture_admin_audit();
