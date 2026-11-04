import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

function applyHeroImage(path?: string | null) {
  if (!supabase) return;
  const image = document.querySelector<HTMLImageElement>('.lux-hero-image img');
  if (!image) return;
  image.dataset.defaultSrc ||= image.src;
  if (!path) {
    image.src = image.dataset.defaultSrc;
    return;
  }
  const url = path.startsWith('http') ? path : supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl;
  if (url) image.src = url;
}

export default function HeroBannerSync() {
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let revision = 0;
    const onUpdate = (event: Event) => {
      revision += 1;
      applyHeroImage((event as CustomEvent).detail?.hero_image_path);
    };
    window.addEventListener('lux-hero-updated', onUpdate);
    const requestRevision = revision;
    void supabase.from('site_content').select('hero_image_path').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (!active || error || requestRevision !== revision) return;
      applyHeroImage(data?.hero_image_path ? String(data.hero_image_path) : null);
    });
    return () => { active = false; window.removeEventListener('lux-hero-updated', onUpdate); };
  }, []);
  return null;
}
