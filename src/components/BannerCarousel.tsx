import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
type Banner = { id: string; title: string; subtitle: string; desktop_image: string; mobile_image: string | null; link: string | null; animation_type: 'fade' | 'slide' };
export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!supabase) { setError('اتصال بنرها در دسترس نیست.'); return; }
    supabase.from('banners').select('id,title,subtitle,desktop_image,mobile_image,link,animation_type').eq('is_active', true).order('display_order').then(({ data, error: queryError }) => {
      if (queryError) setError('نمایش بنرها موقتاً در دسترس نیست.');
      else setBanners(data || []);
    });
  }, []);
  useEffect(() => {
    if (banners.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setCurrent(index => (index + 1) % banners.length), 6500);
    return () => window.clearInterval(timer);
  }, [banners.length]);
  if (!banners.length) return error ? <p className="banner-load-error" role="status">{error}</p> : null;
  const banner = banners[current];
  const image = (path: string) => path.startsWith('http') ? path : supabase?.storage.from('site-media').getPublicUrl(path).data.publicUrl || '';
  const move = (step: number) => setCurrent(index => (index + step + banners.length) % banners.length);
  return <section id="featured-banners" aria-label="بنرهای ویژه" onTouchStart={event => setTouchX(event.touches[0].clientX)} onTouchEnd={event => {
    const delta = touchX === null ? 0 : event.changedTouches[0].clientX - touchX;
    if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
    setTouchX(null);
  }}>
    <style>{'@keyframes banner-fade{from{opacity:.3;filter:brightness(.8)}to{opacity:1;filter:brightness(1)}}@keyframes banner-slide{from{transform:scale(1.025);opacity:.55}to{transform:scale(1);opacity:1}}'}</style>
    <a href={banner.link || '/store'} className="feature-banner-link" key={banner.id}>
      <picture><source media="(max-width: 640px)" srcSet={image(banner.mobile_image || banner.desktop_image)} /><img src={image(banner.desktop_image)} alt={banner.title} fetchPriority="high" decoding="async" style={{ animation: `${banner.animation_type === 'fade' ? 'banner-fade' : 'banner-slide'} .65s ease both` }} /></picture>
      <span className="feature-banner-shade" />
      <span className="feature-banner-copy"><strong>{banner.title}</strong>{banner.subtitle && <span>{banner.subtitle}</span>}</span>
      <span className="feature-banner-counter">{String(current + 1).padStart(2, '0')} / {String(banners.length).padStart(2, '0')}</span>
    </a>
    {banners.length > 1 && <div className="feature-banner-controls"><button type="button" onClick={() => move(-1)} aria-label="بنر قبلی">‹</button><div>{banners.map((item, index) => <button type="button" key={item.id} className={index === current ? 'active' : ''} onClick={() => setCurrent(index)} aria-label={`رفتن به بنر ${index + 1}`} />)}</div><button type="button" onClick={() => move(1)} aria-label="بنر بعدی">›</button></div>}
  </section>;
}
