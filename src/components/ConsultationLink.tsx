import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ConsultationLink({ className = 'button button-dark' }: { className?: string }) {
  const [phone, setPhone] = useState('');
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.from('site_content').select('contact_info').eq('id', 1).maybeSingle().then(({ data }) => {
      if (active) setPhone(String(data?.contact_info?.phone || '').trim());
    });
    return () => { active = false; };
  }, []);
  const normalized = phone.replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  const digits = normalized.replace(/[^\d+]/g, '');
  return digits
    ? <a className={className} href={`tel:${digits}`} aria-label={`تماس برای مشاوره با ${phone}`}><span data-copy-key="footer.consult">درخواست مشاوره</span> · {phone}</a>
    : <span className={className} aria-live="polite">شمارهٔ تماس مشاوره ثبت نشده است</span>;
}
