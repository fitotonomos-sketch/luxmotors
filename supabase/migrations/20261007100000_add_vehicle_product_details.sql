-- migration: add structured vehicle listing details for catalog and vehicle pages
-- affected tables: public.products

alter table public.products
  add column if not exists model text not null default '',
  add column if not exists model_year integer,
  add column if not exists trim text not null default '',
  add column if not exists specifications jsonb not null default '{}'::jsonb,
  add column if not exists options jsonb not null default '[]'::jsonb,
  add column if not exists mileage_km integer,
  add column if not exists body_condition text not null default '',
  add column if not exists mechanical_condition text not null default '',
  add column if not exists customs_status text not null default '',
  add column if not exists assembly_country text not null default '',
  add column if not exists registration_status text not null default '',
  add column if not exists warranty text not null default '',
  add column if not exists fuel_type text not null default '',
  add column if not exists transmission text not null default '',
  add column if not exists drive_type text not null default '';

alter table public.products
  add constraint products_mileage_nonnegative check (mileage_km is null or mileage_km >= 0),
  add constraint products_model_year_reasonable check (model_year is null or model_year between 1950 and 2100);
