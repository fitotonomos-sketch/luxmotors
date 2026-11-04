-- migration: designate the customer's confirmed login email as the main administrator
-- affected tables: admins

insert into public.admins (email, role)
values ('fitotonomos@gmail.com', 'main')
on conflict (email) do update set role = 'main';
