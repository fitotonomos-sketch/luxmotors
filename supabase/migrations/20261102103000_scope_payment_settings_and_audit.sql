-- migration: constrain subadministrator payment-settings writes and disable client audit inserts
-- affected tables: public.site_settings, public.audit_logs
-- function: public.enforce_scoped_admin_updates

create or replace function public.enforce_scoped_admin_updates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_permissions text[];
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  select a.role, a.permissions into v_role, v_permissions
    from public.admins as a
    where lower(a.email) = v_email;
  if v_role is null then raise exception 'Administrator access required.'; end if;
  if v_role in ('main', 'administrator') then return new; end if;

  if tg_table_name = 'products' then
    if 'products.manage' = any(coalesce(v_permissions, '{}'::text[])) then return new; end if;
    if 'seo.manage' = any(coalesce(v_permissions, '{}'::text[]))
       and (to_jsonb(new) - array['seo_title','seo_description','seo_image_path','canonical_url','robots','updated_at'])
           = (to_jsonb(old) - array['seo_title','seo_description','seo_image_path','canonical_url','robots','updated_at']) then return new; end if;
  elsif tg_table_name = 'categories' then
    if 'categories.manage' = any(coalesce(v_permissions, '{}'::text[])) then return new; end if;
    if 'seo.manage' = any(coalesce(v_permissions, '{}'::text[]))
       and (to_jsonb(new) - array['seo_title','seo_description','seo_image_path','canonical_url','robots','updated_at'])
           = (to_jsonb(old) - array['seo_title','seo_description','seo_image_path','canonical_url','robots','updated_at']) then return new; end if;
  elsif tg_table_name = 'site_content' then
    if 'content.manage' = any(coalesce(v_permissions, '{}'::text[])) then return new; end if;
    if 'media.manage' = any(coalesce(v_permissions, '{}'::text[]))
       and (to_jsonb(new) - array['logo_path','favicon_path','og_image_path','hero_image_path','updated_at'])
           = (to_jsonb(old) - array['logo_path','favicon_path','og_image_path','hero_image_path','updated_at']) then return new; end if;
  elsif tg_table_name = 'orders' then
    if 'orders.manage' = any(coalesce(v_permissions, '{}'::text[]))
       and (to_jsonb(new) - array['status','payment_status','updated_at'])
           = (to_jsonb(old) - array['status','payment_status','updated_at']) then return new; end if;
  elsif tg_table_name = 'site_settings' then
    if ('settings.manage' = any(coalesce(v_permissions, '{}'::text[])) or 'content.manage' = any(coalesce(v_permissions, '{}'::text[])))
       and (to_jsonb(new) - array['bank_name','account_holder','card_number','payment_instructions','support_id','updated_at'])
           = (to_jsonb(old) - array['bank_name','account_holder','card_number','payment_instructions','support_id','updated_at']) then return new; end if;
  end if;

  raise exception 'This administrator cannot update these fields.';
end;
$$;
revoke execute on function public.enforce_scoped_admin_updates() from public, anon, authenticated;

drop trigger if exists enforce_scoped_payment_settings_updates on public.site_settings;
create trigger enforce_scoped_payment_settings_updates before update on public.site_settings
  for each row execute function public.enforce_scoped_admin_updates();

-- Audit writes are made by the security-definer mutation trigger, not by a
-- browser-authored row that could misrepresent an event.
drop policy if exists "Admins can record audit events" on public.audit_logs;
revoke insert on public.audit_logs from anon, authenticated;
