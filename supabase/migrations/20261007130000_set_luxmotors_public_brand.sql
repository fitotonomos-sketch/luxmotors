-- migration: align initial site settings with the confirmed Lux Motors brand
-- affected tables: public.site_content, public.site_settings

update public.site_content
set site_name = 'لوکس موتورز', tagline = 'انتخاب ممتاز · منطقه آزاد', updated_at = now()
where id = 1 and site_name = 'خانه‌دار';

update public.site_settings
set site_name = 'لوکس موتورز'
where id = 1 and site_name = 'خانه‌دار';
