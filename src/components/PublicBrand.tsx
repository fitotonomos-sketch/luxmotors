import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
type Content = { site_name?: string; tagline?: string; logo_path?: string | null };
const safeDecode = (value: string) => { try { return decodeURIComponent(value); } catch { return value; } };
function mediaUrl(path?: string | null) { if (!path || !supabase) return ''; const marker='/storage/v1/object/public/site-media/'; const normalized=path.includes(marker)?path.slice(path.indexOf(marker)+marker.length):path; return /^https?:\/\//i.test(normalized)?normalized:supabase.storage.from('site-media').getPublicUrl(decodeURIComponent(normalized.replace(/^\/+/,''))).data.publicUrl; }
export function SiteBrand({ compact = false }: { compact?: boolean }) {
  const [content, setContent] = useState<Content>({ site_name: 'لوکس موتورز', tagline: 'انتخاب ممتاز · منطقه آزاد' });
  const [logoFailed,setLogoFailed]=useState(false);
  useEffect(() => { if (!supabase) return; let active=true; let locallyUpdated=false; const onUpdate=(event:Event)=>{locallyUpdated=true;const logoPath=(event as CustomEvent).detail?.logo_path;setContent(current=>({...current,logo_path:logoPath??null}));}; window.addEventListener('lux-brand-updated',onUpdate); void supabase.from('site_content').select('site_name,tagline,logo_path').eq('id',1).maybeSingle().then(({data,error})=>{if(active&&!error&&data){setContent(current=>({...data,logo_path:locallyUpdated?current.logo_path:data.logo_path}));}}); return()=>{active=false;window.removeEventListener('lux-brand-updated',onUpdate);}; }, []);
  const logo = mediaUrl(content.logo_path);
  useEffect(()=>{setLogoFailed(false);},[content.logo_path]);
  return <span className="wordmark" aria-label={content.site_name}><span className="brand-mark">{logo&&!logoFailed ? <img key={content.logo_path} src={logo} alt="" style={{ maxWidth: 48, maxHeight: 48, objectFit: 'contain' }} onError={()=>setLogoFailed(true)} /> : content.site_name?.slice(0, 1)}</span><span>{content.site_name}<small>{!compact && content.tagline}</small></span></span>;
}
export function PublicFooterContent() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { if (!supabase) return; supabase.from('site_content').select('footer_content,contact_info,social_links').eq('id', 1).maybeSingle().then(({ data }) => setData(data)); }, []);
  if (!data) return null;
  return <div className="cms-footer-content">{data.footer_content && <p>{data.footer_content}</p>}{data.contact_info?.email && <a href={`mailto:${data.contact_info.email}`}>{data.contact_info.email}</a>}{data.contact_info?.phone && <a href={`tel:${data.contact_info.phone}`}>{data.contact_info.phone}</a>}{Object.entries(data.social_links || {}).filter(([, url]) => typeof url === 'string' && url).map(([name, url]) => <a key={name} href={String(url)} target="_blank" rel="noreferrer">{name}</a>)}</div>;
}
export default function PublicMetaSync() {
  useEffect(() => {
    if (!supabase) return;
    const meta = (selector: string, value: string) => { let node = document.querySelector(selector) as HTMLMetaElement | null; if (!node) { node = document.createElement('meta'); const property = selector.match(/property="([^"]+)/)?.[1]; if (property) node.setAttribute('property', property); else node.name = selector.match(/name="([^"]+)/)?.[1] || ''; document.head.append(node); } node.content = value; };
    const canonicalTag = (value: string) => { let node = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null; if (!node) { node = document.createElement('link'); node.rel = 'canonical'; document.head.append(node); } node.href = value; };
    const jsonld = (value: any) => { let node = document.querySelector('#dynamic-jsonld') as HTMLScriptElement | null; if (!node) { node = document.createElement('script'); node.id = 'dynamic-jsonld'; node.type = 'application/ld+json'; document.head.append(node); } node.textContent = JSON.stringify(value); };
    void (async () => {
      const { data: site } = await supabase.from('site_content').select('site_name,seo_title,seo_description,canonical_url,robots,favicon_path,og_image_path').eq('id', 1).maybeSingle();
      if (!site) return;
      let title = site.seo_title || site.site_name; let description = site.seo_description || ''; let canonical = site.canonical_url || location.href; let robots = site.robots || 'index,follow'; let image = site.og_image_path; let schema: any = { '@context': 'https://schema.org', '@type': 'WebSite', name: site.site_name, url: location.origin };
      const productSlug = location.pathname.match(/^\/products\/([^/]+)\/?$/)?.[1] || (location.pathname === '/products' ? new URLSearchParams(location.search).get('slug') : null);
      const categorySlug = location.pathname.match(/^\/categories\/([^/]+)\/?$/)?.[1] || (location.pathname === '/categories' ? new URLSearchParams(location.search).get('slug') : null);
      if (productSlug) {
        const { data: p } = await supabase.from('products').select('name,slug,description,price,stock,image_url,seo_title,seo_description,seo_image_path,canonical_url,robots').eq('slug', safeDecode(productSlug)).eq('published', true).maybeSingle();
        if (p) { title = p.seo_title || p.name; description = p.seo_description || p.description; canonical = p.canonical_url || `${location.origin}/products?slug=${encodeURIComponent(p.slug)}`; robots = p.robots || 'index,follow'; image = p.seo_image_path || p.image_url; schema = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description, image: mediaUrl(image), offers: { '@type': 'Offer', price: Number(p.price) * 10, priceCurrency: 'IRR', availability: Number(p.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: canonical } }; }
      } else if (categorySlug) {
        const { data: c } = await supabase.from('categories').select('name,slug,seo_title,seo_description,seo_image_path,canonical_url,robots').eq('slug', safeDecode(categorySlug)).eq('is_published', true).maybeSingle();
        if (c) { title = c.seo_title || c.name; description = c.seo_description || ''; canonical = c.canonical_url || `${location.origin}/categories?slug=${encodeURIComponent(c.slug)}`; robots = c.robots || 'index,follow'; image = c.seo_image_path || image; schema = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url: canonical }; }
      }
      document.title = title; if (description) meta('meta[name="description"]', description); meta('meta[name="robots"]', robots); meta('meta[property="og:type"]', productSlug ? 'product' : 'website'); meta('meta[property="og:title"]', title); if (description) meta('meta[property="og:description"]', description); if (image) meta('meta[property="og:image"]', mediaUrl(image)); meta('meta[name="twitter:card"]', image ? 'summary_large_image' : 'summary'); meta('meta[name="twitter:title"]', title); if (description) meta('meta[name="twitter:description"]', description); canonicalTag(canonical); jsonld(schema);
      if (site.favicon_path) { let icon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null; if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.append(icon); } icon.href = mediaUrl(site.favicon_path); }
    })();
  }, []);
  return null;
}
