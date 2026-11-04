import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function SiteCopySync() {
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let overrides: Record<string, string> = {};
    const applyOverrides = () => {
      document.querySelectorAll<HTMLElement>('[data-copy-key]').forEach(element => {
        const value = overrides[element.dataset.copyKey || ''];
        if (typeof value === 'string' && element.textContent !== value) element.textContent = value;
      });
    };
    const observer = new MutationObserver(applyOverrides);
    observer.observe(document.body, { childList: true, subtree: true });
    void supabase.from('site_content').select('page_copy').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (!active || error || !data?.page_copy || typeof data.page_copy !== 'object') return;
      overrides = Object.fromEntries(Object.entries(data.page_copy as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
      applyOverrides();
    });
    return () => { active = false; observer.disconnect(); };
  }, []);
  return null;
}
