import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
function latinDigits(value: string) {
  return value.replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}
export default function WhatsAppFloat() {
  const [phone, setPhone] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!supabase) { setLoaded(true); return; }
    let active = true;
    supabase.from('site_content').select('contact_info,social_links').eq('id', 1).maybeSingle().then(({ data }) => {
      if (!active) return;
      if (data) {
        setPhone(String(data.contact_info?.phone || '').trim());
        setWhatsappUrl(String(data.social_links?.whatsapp || '').trim());
      }
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);
  const digits = latinDigits(phone).replace(/\D/g, '');
  const number = digits.startsWith('00') ? digits.slice(2) : digits.startsWith('0') ? `98${digits.slice(1)}` : digits;
  const link = number ? `https://wa.me/${number}` : /^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(whatsappUrl) ? whatsappUrl : '';
  const icon = <svg viewBox="0 0 32 32" width="25" height="25" aria-hidden="true" fill="currentColor"><path d="M16 .9A15 15 0 0 0 3.1 23.6L1 31l7.6-2A15 15 0 1 0 16 .9Zm0 27.3a12.2 12.2 0 0 1-6.2-1.7l-.5-.3-4.5 1.2 1.2-4.4-.3-.5A12.3 12.3 0 1 1 16 28.2Zm6.7-9.2c-.4-.2-2.1-1-2.4-1.1-.3-.1-.6-.2-.8.2-.2.4-.9 1.1-1.1 1.3-.2.2-.4.3-.8.1-.4-.2-1.5-.6-2.9-1.8-1.1-1-1.8-2.1-2-2.5-.2-.4 0-.6.2-.8l.6-.7c.2-.2.2-.4.4-.6.1-.2 0-.5 0-.7-.1-.2-.8-1.9-1.1-2.6-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.7.1-1 .5-.4.4-1.3 1.3-1.3 3.1 0 1.8 1.3 3.5 1.5 3.8.2.2 2.6 4 6.3 5.6.9.4 1.6.6 2.1.7.9.3 1.7.2 2.3.1.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.5.2-1.7-.1-.1-.4-.3-.8-.5Z"/></svg>;
  const label = <span data-copy-key="floating.whatsapp">مشاوره واتساپی</span>;
  if (link) return <a className="whatsapp-float" href={link} target="_blank" rel="noopener noreferrer" aria-label="گفت‌وگو با لوکس موتورز در واتساپ">{icon}{label}</a>;
  return <span className="whatsapp-float whatsapp-unconfigured" title={loaded ? 'برای فعال‌سازی، شماره تماس را در بخش محتوای پنل مدیریت ثبت کنید.' : 'در حال دریافت اطلاعات پشتیبانی'} aria-label="آیکن پشتیبانی واتساپ؛ شماره هنوز تنظیم نشده است">{icon}{loaded ? <span>واتساپ</span> : label}</span>;
}
