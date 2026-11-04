-- migration: restrict media library metadata to administrators while preserving public object delivery
-- affected tables: media_assets

drop policy "Public can view registered media" on public.media_assets;
create policy "Admins can view registered media" on public.media_assets for select to authenticated
  using ((select auth.jwt() ->> 'email') in (select email from public.admins));
