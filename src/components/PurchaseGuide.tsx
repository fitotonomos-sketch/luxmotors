import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type GuideSection = { id: string; title: string; body: string; display_order: number };

export default function PurchaseGuide() {
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let active = true;
    void supabase.from('purchase_guide_sections').select('id,title,body,display_order')
      .eq('is_published', true).order('display_order').order('created_at')
      .then(({ data }) => { if (active) { setSections(data || []); setLoading(false); } });
    return () => { active = false; };
  }, []);

  return <aside className="purchase-guide-float" dir="rtl" aria-label="راهنمای مراحل خرید">
    <a href="/purchase-guide" aria-label="مشاهده راهنمای کامل خرید"><span className="purchase-guide-icon" aria-hidden="true">✦</span><span>راهنمای خرید</span><span aria-hidden="true">↗</span></a>
    {!loading && sections.slice(0, 3).map((section, index) => <a className="purchase-guide-step" href="/purchase-guide" key={section.id}><b>{String(index + 1).padStart(2, '0')}</b><span>{section.title}</span></a>)}
  </aside>;
}
