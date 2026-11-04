-- migration: add scoped subadministrator permissions and secure administrator management
-- affected tables: admins and existing administrator policies

-- Make deployment retries safe if a prior run stopped midway.
do $$ begin
  drop policy if exists "Admins can view own roster row or manager roster" on public.admins;
  drop policy if exists "Main admins can add administrators" on public.admins;
  drop policy if exists "Main admins can update administrators" on public.admins;
  drop policy if exists "Main admins can remove administrators" on public.admins;
  drop policy if exists "Product managers can view all products" on public.products;
  drop policy if exists "Product managers can insert products" on public.products;
  drop policy if exists "Product managers can update products" on public.products;
  drop policy if exists "Product managers can delete products" on public.products;
  drop policy if exists "Settings managers can update site settings" on public.site_settings;
  drop policy if exists "Content managers can update site content" on public.site_content;
  drop policy if exists "Banner managers can view all banners" on public.banners;
  drop policy if exists "Banner managers can create banners" on public.banners;
  drop policy if exists "Banner managers can update banners" on public.banners;
  drop policy if exists "Banner managers can delete banners" on public.banners;
  drop policy if exists "SEO managers can view categories" on public.categories;
  drop policy if exists "SEO managers can create categories" on public.categories;
  drop policy if exists "SEO managers can update categories" on public.categories;
  drop policy if exists "SEO managers can delete categories" on public.categories;
  drop policy if exists "Media managers can view registered media" on public.media_assets;
  drop policy if exists "Media managers can register media" on public.media_assets;
  drop policy if exists "Media managers can delete media records" on public.media_assets;
  drop policy if exists "Media managers upload site media" on storage.objects;
  drop policy if exists "Media managers update own site media" on storage.objects;
  drop policy if exists "Media managers delete own site media" on storage.objects;
  drop policy if exists "Main admins can view audit logs" on public.audit_logs;
  drop policy if exists "Admins can record audit events" on public.audit_logs;
  drop policy if exists "Order managers can view orders" on public.orders;
  drop policy if exists "Order managers can update orders" on public.orders;
  drop policy if exists "Order managers can view order items" on public.order_items;
  drop trigger if exists protect_last_main_admin on public.admins;
  drop trigger if exists audit_products on public.products;
  drop trigger if exists audit_orders on public.orders;
  drop trigger if exists audit_banners on public.banners;
  drop trigger if exists audit_settings on public.site_settings;
  drop trigger if exists audit_site_content on public.site_content;
  drop trigger if exists audit_admins on public.admins;
  drop trigger if exists audit_categories on public.categories;
end $$;

alter table public.admins add column if not exists role text not null default 'subadmin';
alter table public.admins add column if not exists permissions text[] not null default '{}'::text[];
alter table public.admins drop constraint if exists admins_role_check;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'admins_role_check' and conrelid = 'public.admins'::regclass) then
    alter table public.admins add constraint admins_role_check check (role in ('main','administrator','subadmin'));
  end if;
end $$;

create or replace function public.has_admin_permission(p_permission text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and (
        a.role = 'main'
        or (a.role = 'administrator' and p_permission not in ('admins.manage','audit.view'))
        or (a.role = 'subadmin' and (
          p_permission = any(a.permissions)
          or p_permission = 'audit.write'
        ))
      )
  );
$$;
revoke execute on function public.has_admin_permission(text) from public, anon;
grant execute on function public.has_admin_permission(text) to authenticated;

-- Authenticated users can see their own administrator entry; only main admins can see the roster.
drop policy if exists "Authenticated users can read admin list" on public.admins;
drop policy if exists "Admins can view own roster row or manager roster" on public.admins;
create policy "Admins can view own roster row or manager roster" on public.admins
  for select to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')) or (select public.has_admin_permission('admins.manage')));

drop policy if exists "Main admins can add administrators" on public.admins;
drop policy if exists "Main admins can update administrators" on public.admins;
drop policy if exists "Main admins can remove administrators" on public.admins;
create policy "Main admins can add administrators" on public.admins for insert to authenticated
  with check ((select public.has_admin_permission('admins.manage')));
create policy "Main admins can update administrators" on public.admins for update to authenticated
  using ((select public.has_admin_permission('admins.manage')))
  with check ((select public.has_admin_permission('admins.manage')));
create policy "Main admins can remove administrators" on public.admins for delete to authenticated
  using ((select public.has_admin_permission('admins.manage')) and role <> 'main');

-- Main administrators cannot remove or demote the last main account.
create or replace function public.protect_last_main_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'main' then
    if tg_op = 'DELETE' then
      if (select count(*) from public.admins where role = 'main') <= 1 then raise exception 'The last main administrator cannot be removed.'; end if;
      return old;
    elsif new.role <> 'main' and (select count(*) from public.admins where role = 'main') <= 1 then
      raise exception 'The last main administrator cannot be demoted.';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.protect_last_main_admin() from public, anon, authenticated;
create trigger protect_last_main_admin before update or delete on public.admins for each row execute function public.protect_last_main_admin();

-- Replace broad administrator membership checks with feature-specific permissions.
drop policy if exists "Admins can read all products" on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;
create policy "Product managers can view all products" on public.products for select to authenticated using ((select public.has_admin_permission('products.manage')) or (select public.has_admin_permission('seo.manage')));
create policy "Product managers can insert products" on public.products for insert to authenticated with check ((select public.has_admin_permission('products.manage')));
create policy "Product managers can update products" on public.products for update to authenticated using ((select public.has_admin_permission('products.manage')) or (select public.has_admin_permission('seo.manage'))) with check ((select public.has_admin_permission('products.manage')) or (select public.has_admin_permission('seo.manage')));
create policy "Product managers can delete products" on public.products for delete to authenticated using ((select public.has_admin_permission('products.manage')));

-- Scope existing content policies.
drop policy if exists "Admins can update payment settings" on public.site_settings;
create policy "Settings managers can update site settings" on public.site_settings for update to authenticated using ((select public.has_admin_permission('settings.manage')) or (select public.has_admin_permission('content.manage'))) with check ((select public.has_admin_permission('settings.manage')) or (select public.has_admin_permission('content.manage')));
drop policy if exists "Admins can update site content" on public.site_content;
create policy "Content managers can update site content" on public.site_content for update to authenticated using ((select public.has_admin_permission('content.manage')) or (select public.has_admin_permission('seo.manage'))) with check ((select public.has_admin_permission('content.manage')) or (select public.has_admin_permission('seo.manage')));

-- Banner permissions.
drop policy if exists "Admins can view all banners" on public.banners;
drop policy if exists "Admins can create banners" on public.banners;
drop policy if exists "Admins can update banners" on public.banners;
drop policy if exists "Admins can delete banners" on public.banners;
create policy "Banner managers can view all banners" on public.banners for select to authenticated using ((select public.has_admin_permission('banners.manage')));
create policy "Banner managers can create banners" on public.banners for insert to authenticated with check ((select public.has_admin_permission('banners.manage')));
create policy "Banner managers can update banners" on public.banners for update to authenticated using ((select public.has_admin_permission('banners.manage'))) with check ((select public.has_admin_permission('banners.manage')));
create policy "Banner managers can delete banners" on public.banners for delete to authenticated using ((select public.has_admin_permission('banners.manage')));

-- Category and SEO permissions.
drop policy if exists "Admins can view categories" on public.categories;
drop policy if exists "Admins can create categories" on public.categories;
drop policy if exists "Admins can update categories" on public.categories;
drop policy if exists "Admins can delete categories" on public.categories;
create policy "SEO managers can view categories" on public.categories for select to authenticated using ((select public.has_admin_permission('seo.manage')) or (select public.has_admin_permission('categories.manage')));
create policy "SEO managers can create categories" on public.categories for insert to authenticated with check ((select public.has_admin_permission('seo.manage')) or (select public.has_admin_permission('categories.manage')));
create policy "SEO managers can update categories" on public.categories for update to authenticated using ((select public.has_admin_permission('seo.manage')) or (select public.has_admin_permission('categories.manage'))) with check ((select public.has_admin_permission('seo.manage')) or (select public.has_admin_permission('categories.manage')));
create policy "SEO managers can delete categories" on public.categories for delete to authenticated using ((select public.has_admin_permission('seo.manage')) or (select public.has_admin_permission('categories.manage')));

-- Media library permissions.
drop policy if exists "Admins can view registered media" on public.media_assets;
drop policy if exists "Admins can register media" on public.media_assets;
drop policy if exists "Admins can delete media records" on public.media_assets;
create policy "Media managers can view registered media" on public.media_assets for select to authenticated using ((select public.has_admin_permission('media.manage')));
create policy "Media managers can register media" on public.media_assets for insert to authenticated with check ((select public.has_admin_permission('media.manage')));
create policy "Media managers can delete media records" on public.media_assets for delete to authenticated using ((select public.has_admin_permission('media.manage')));

-- Storage object authorization matches the media permission.
drop policy if exists "Admins upload site media" on storage.objects;
drop policy if exists "Admins update own site media" on storage.objects;
drop policy if exists "Admins delete own site media" on storage.objects;
create policy "Media managers upload site media" on storage.objects for insert to authenticated with check (bucket_id = 'site-media' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub') and (select public.has_admin_permission('media.manage')));
create policy "Media managers update own site media" on storage.objects for update to authenticated using (bucket_id = 'site-media' and owner_id = (select auth.jwt() ->> 'sub') and (select public.has_admin_permission('media.manage')));
create policy "Media managers delete own site media" on storage.objects for delete to authenticated using (bucket_id = 'site-media' and owner_id = (select auth.jwt() ->> 'sub') and (select public.has_admin_permission('media.manage')));

-- Audit logs are visible only to main administrators and may only be written by authorized admins.
drop policy if exists "Main admins can view audit logs" on public.audit_logs;
drop policy if exists "Admins can record audit events" on public.audit_logs;
create policy "Main admins can view audit logs" on public.audit_logs for select to authenticated using ((select public.has_admin_permission('admins.manage')));
create policy "Admins can record audit events" on public.audit_logs for insert to authenticated with check (admin_id = (select auth.uid()) and (select public.has_admin_permission('audit.write')));

-- Preserve order management for existing admins; subadmins must have orders permission.
drop policy if exists "Admins can view all orders" on public.orders;
drop policy if exists "Admins can update order statuses" on public.orders;
create policy "Order managers can view orders" on public.orders for select to authenticated using ((select public.has_admin_permission('orders.manage')));
create policy "Order managers can update orders" on public.orders for update to authenticated using ((select public.has_admin_permission('orders.manage'))) with check ((select public.has_admin_permission('orders.manage')));
drop policy if exists "Admins can view order items" on public.order_items;
create policy "Order managers can view order items" on public.order_items for select to authenticated using ((select public.has_admin_permission('orders.manage')));
