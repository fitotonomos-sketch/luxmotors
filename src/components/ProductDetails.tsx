import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type VehicleProduct = {
  id: string; name: string; slug: string; model?: string; model_year?: number | null; trim?: string;
  description?: string; short_description?: string; category?: string; price: number; image_url?: string;
  stock: number; specifications?: Record<string, unknown>; options?: string[]; gallery_images?: string[]; mileage_km?: number | null;
  body_condition?: string; mechanical_condition?: string; customs_status?: string; assembly_country?: string;
  registration_status?: string; warranty?: string; fuel_type?: string; transmission?: string; drive_type?: string;
};
const money = (value: number) => new Intl.NumberFormat('fa-IR').format(value);
const safeDecode = (value: string) => { try { return decodeURIComponent(value); } catch { return value; } };
const imageUrl = (source: string) => source.startsWith('http') ? source : supabase?.storage.from('site-media').getPublicUrl(source).data.publicUrl || ''; 
export default function ProductDetails() {
  const [product, setProduct] = useState<VehicleProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeImage, setActiveImage] = useState('');
  useEffect(() => {
    const slug = new URLSearchParams(location.search).get('slug') || safeDecode(location.pathname.match(/^\/products\/([^/]+)/)?.[1] || '');
    if (!supabase) { setError('اتصال فروشگاه برقرار نیست؛ لطفاً کمی بعد دوباره تلاش کنید.'); setLoading(false); return; }
    if (!slug) { setError('شناسه خودرو در پیوند پیدا نشد؛ از فروشگاه دوباره کارت خودرو را انتخاب کنید.'); setLoading(false); return; }
    supabase.from('products').select('*').eq('slug', slug).eq('published', true).maybeSingle().then(({ data, error: queryError }) => {
      if (queryError) setError(`بارگذاری جزئیات خودرو با مشکل مواجه شد: ${queryError.message}`);
      else if (!data) setError('این خودرو منتشر نشده یا از فهرست موجودی خارج شده است.');
      else {
        const item = data as VehicleProduct;
        setProduct(item);
        setActiveImage(item.image_url || item.gallery_images?.[0] || '');
      }
      setLoading(false);
    });
  }, []);
  function addToCart() {
    if (!product) return;
    try {
      const key = 'khanedar-cart';
      const items = JSON.parse(localStorage.getItem(key) || '[]') as { product_id: string; quantity: number }[];
      const current = items.find(item => item.product_id === product.id);
      if (current) current.quantity = Math.min(product.stock, current.quantity + 1);
      else items.push({ product_id: product.id, quantity: 1 });
      localStorage.setItem(key, JSON.stringify(items));
      location.href = '/cart';
    } catch { setNotice('افزودن این خودرو به فهرست انتخاب‌ها ممکن نشد. دوباره تلاش کنید.'); }
  }
  if (loading) return <section className="page-shell admin-gate" id="product-details"><h1>در حال بارگذاری مشخصات خودرو…</h1></section>;
  if (error || !product) return <section className="page-shell product-unavailable" id="product-details"><h1>خودرو پیدا نشد</h1><p>{error}</p><a href="/store" className="button button-dark">بازگشت به موجودی خودروها</a></section>;
  const specs = Object.entries(product.specifications || {}).filter(([, value]) => value !== null && value !== undefined && String(value).trim());
  const fields: [string, unknown][] = [
    ['مدل', product.model], ['سال ساخت', product.model_year], ['تیپ', product.trim], ['کارکرد', product.mileage_km == null ? '' : `${money(product.mileage_km)} کیلومتر`],
    ['نوع سوخت', product.fuel_type], ['گیربکس', product.transmission], ['سیستم انتقال نیرو', product.drive_type], ['کشور مونتاژ', product.assembly_country],
    ['وضعیت گمرکی', product.customs_status], ['وضعیت شماره‌گذاری', product.registration_status], ['وضعیت بدنه', product.body_condition],
    ['سلامت فنی', product.mechanical_condition], ['ضمانت', product.warranty], ['دسته‌بندی', product.category],
  ].filter(([, value]) => value !== null && value !== undefined && String(value).trim());
  const options = Array.isArray(product.options) ? product.options : [];
  const galleryImages = [...new Set([product.image_url, ...(product.gallery_images || [])].filter((image): image is string => !!image))];
  return <section className="vehicle-detail page-shell" id="product-details" dir="rtl">
    <div className="vehicle-detail-top"><a className="text-link" href="/store" data-copy-key="product.back">← بازگشت به خودروها</a><span className="eyebrow" data-copy-key="product.eyebrow">LUX MOTORS · پرونده خودرو</span></div>
    <div className="vehicle-detail-hero">
      <div className="vehicle-gallery">{activeImage ? <img className="vehicle-detail-image" src={imageUrl(activeImage)} alt={`${product.name}${product.model_year ? ` مدل ${product.model_year}` : ''}`} fetchPriority="high" decoding="async" /> : <div className="vehicle-detail-image vehicle-image-placeholder">LUX MOTORS</div>}{galleryImages.length>1&&<div className="vehicle-gallery-thumbs" aria-label="تصاویر بیشتر خودرو">{galleryImages.map((image,index)=><button type="button" className={activeImage===image?'active':''} key={`${image}-${index}`} onClick={()=>setActiveImage(image)} aria-label={`نمایش تصویر ${index+1}`}><img src={imageUrl(image)} alt="" loading="lazy"/></button>)}</div>}</div>
      <div className="vehicle-detail-summary"><span className="eyebrow">{product.category || 'خودروی وارداتی'}</span><h1>{product.name}</h1><p className="vehicle-detail-model">{[product.model || product.trim, product.model_year && `مدل ${product.model_year}`].filter(Boolean).join(' · ')}</p>{product.short_description && <p>{product.short_description}</p>}<strong className="vehicle-detail-price">{money(product.price)} تومان</strong><div className={product.stock > 0 ? 'vehicle-stock is-available' : 'vehicle-stock'}>{product.stock > 0 ? 'برای استعلام موجودی تماس بگیرید' : 'در حال حاضر موجود نیست'}</div><button className="button button-dark" disabled={product.stock < 1} onClick={addToCart} data-copy-key="product.cta">افزودن به فهرست انتخاب‌ها</button>{notice && <p role="alert">{notice}</p>}</div>
    </div>
    {product.description && <section className="vehicle-detail-section" id="vehicle-description"><span className="eyebrow" data-copy-key="product.about_eyebrow">معرفی خودرو</span><h2 data-copy-key="product.about_title">درباره این خودرو</h2><p className="vehicle-description-copy">{product.description}</p></section>}
    {(fields.length > 0 || specs.length > 0) && <section className="vehicle-detail-section" id="vehicle-specifications"><span className="eyebrow" data-copy-key="product.specs_eyebrow">مشخصات</span><h2 data-copy-key="product.specs_title">مشخصات فنی و وضعیت</h2><dl className="vehicle-spec-grid">{[...fields, ...specs].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{String(value)}</dd></div>)}</dl></section>}
    {options.length > 0 && <section className="vehicle-detail-section" id="vehicle-options"><span className="eyebrow" data-copy-key="product.options_eyebrow">تجهیزات</span><h2 data-copy-key="product.options_title">آپشن‌ها و امکانات</h2><ul className="vehicle-options-list">{options.map((option, index) => <li key={`${option}-${index}`}>{option}</li>)}</ul></section>}
    <p className="vehicle-detail-disclaimer" data-copy-key="product.disclaimer">اطلاعات آگهی، کارکرد، وضعیت بدنه، سلامت، مدارک و گمرک را پیش از هر معامله با بازدید حضوری و کارشناسی مستقل بررسی کنید.</p>
  </section>;
}
