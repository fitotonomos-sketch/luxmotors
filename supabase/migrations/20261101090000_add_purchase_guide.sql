-- migration: add editable public purchase guide sections
-- affected tables: public.purchase_guide_sections

create table if not exists public.purchase_guide_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  body text not null check (char_length(trim(body)) between 1 and 5000),
  display_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.purchase_guide_sections enable row level security;

create policy "Published purchase guide sections are public"
  on public.purchase_guide_sections for select to anon, authenticated
  using (is_published = true);

create policy "Admins can view all purchase guide sections"
  on public.purchase_guide_sections for select to authenticated
  using ((select public.has_admin_permission('content.manage')));

create policy "Content managers can create purchase guide sections"
  on public.purchase_guide_sections for insert to authenticated
  with check ((select public.has_admin_permission('content.manage')));

create policy "Content managers can update purchase guide sections"
  on public.purchase_guide_sections for update to authenticated
  using ((select public.has_admin_permission('content.manage')))
  with check ((select public.has_admin_permission('content.manage')));

create policy "Content managers can delete purchase guide sections"
  on public.purchase_guide_sections for delete to authenticated
  using ((select public.has_admin_permission('content.manage')));

create index if not exists purchase_guide_sections_order_idx
  on public.purchase_guide_sections (display_order, created_at);
