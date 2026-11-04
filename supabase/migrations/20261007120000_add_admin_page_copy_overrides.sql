-- migration: store editable website copy overrides in the existing CMS record
-- affected tables: public.site_content

alter table public.site_content add column if not exists page_copy jsonb not null default '{}'::jsonb;
