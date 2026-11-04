-- migration: ensure administrator role fields exist for existing deployments
-- affected tables: public.admins

alter table public.admins add column if not exists role text not null default 'subadmin';
alter table public.admins add column if not exists permissions text[] not null default '{}'::text[];

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'admins_role_check' and conrelid = 'public.admins'::regclass) then
    alter table public.admins add constraint admins_role_check check (role in ('main','administrator','subadmin'));
  end if;
end $$;

update public.admins set role = 'main' where lower(email) = 'fitotonomos@gmail.com';
