import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type GuideSection = { id: string; title: string; body: string; display_order: number };
export default function PurchaseGuidePage() {
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let active = true;
    void supabase.from('purchase_guide_sections').select('id,title,body,display_order').eq('is_published', true).order('display_order').order('created_at')
      .then(({ data }) => { if (active) { setSections(data || []); setLoading(false); } });
    return () => { active = false; };
  }, []);
  return <section className="purchase-guide-page page-shell" id="purchase-guide" dir="rtl">
    <span className="lux-eyebrow">LUX MOTORS · راهنمای مشتری</span><h1>مراحل خرید، <em>شفاف و مطمئن.</em></h1>
    <p className="purchase-guide-lead">از انتخاب خودرو تا بررسی مدارک و تحویل، در هر مرحله همراه شما هستیم.</p>
    {loading ? <p role="status">در حال بارگذاری راهنما…</p> : sections.length ? <ol>{sections.map((section, index) => <li key={section.id}><span className="purchase-guide-number">{String(index + 1).padStart(2, '0')}</span><article><h2>{section.title}</h2><p>{section.body}</p></article></li>)}</ol> : <div className="purchase-guide-empty">راهنمای مراحل خرید در حال آماده‌سازی است. برای دریافت راهنمایی با تیم لوکس موتورز تماس بگیرید.</div>}
    <a className="lux-cta" href="/store">مشاهده خودروهای منتخب <span aria-hidden="true">←</span></a>
  </section>;
}
