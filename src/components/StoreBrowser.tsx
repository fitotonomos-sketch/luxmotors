import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ArrowDownUp, PackageSearch } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Product = { id: string; name: string; slug: string; description: string; category: string; price: number; image_url: string; stock: number; created_at: string; model?: string; model_year?: number | null; trim?: string };
const categories = ['همه خودروها', 'شاسی‌بلند', 'سدان', 'برقی', 'هیبرید'];

export default function StoreBrowser() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryNames, setCategoryNames] = useState(categories.slice(1));
  const [activeCategory, setActiveCategory] = useState(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('category') || categories[0]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('جدیدترین');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (supabase) supabase.from('categories').select('name').eq('is_published', true).order('name').then(({data}) => { if (data?.length) setCategoryNames(data.map(row => row.name)); });
    if (!supabase) { setError('اتصال فروشگاه در دسترس نیست.'); setLoading(false); return; }
    supabase.from('products').select('id,name,slug,description,category,price,image_url,stock,created_at,model,model_year,trim').eq('published', true).then(({ data, error }) => {
      if (error) setError('بارگذاری محصولات با مشکل روبه‌رو شد.');
      setProducts(data || []); setLoading(false);
    });
  }, []);
  const visible = useMemo(() => {
    const filtered = products.filter(p => (activeCategory === categories[0] || p.category === activeCategory) && `${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase()));
    return filtered.sort((a, b) => sort === 'ارزان‌ترین' ? a.price - b.price : sort === 'گران‌ترین' ? b.price - a.price : new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [products, activeCategory, query, sort]);
  return <div className="store-browser" id="collections" dir="rtl">
    <div className="store-toolbar"><label className="search-box"><Search size={18} strokeWidth={1.7} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="جست‌وجوی برند، مدل یا تیپ..." aria-label="جست‌وجو در محصولات" /></label><label className="sort-box"><ArrowDownUp size={16} /><span>مرتب‌سازی:</span><select value={sort} onChange={e => setSort(e.target.value)} aria-label="مرتب‌سازی محصولات"><option>جدیدترین</option><option>ارزان‌ترین</option><option>گران‌ترین</option></select></label></div>
    <div className="store-content"><aside className="category-filter"><h3><SlidersHorizontal size={16} /> دسته‌بندی</h3>{[categories[0], ...categoryNames].map(category => <button key={category} className={activeCategory === category ? 'filter-option active' : 'filter-option'} onClick={() => setActiveCategory(category)}>{category}<span>{activeCategory === category ? '•' : '＋'}</span></button>)}</aside>
      <div className="product-results" aria-live="polite">{error && <p role="alert">{error}</p>}{loading ? <p>در حال بارگذاری محصولات…</p> : visible.length ? <div className="product-grid">{visible.map(p => <a className="product-card vehicle-listing-card" key={p.id} href={`/products/${encodeURIComponent(p.slug)}`} aria-label={`مشاهده جزئیات ${p.name}`}>{p.image_url ? <img src={p.image_url} alt={`${p.name}${p.model_year ? ` مدل ${p.model_year}` : ''}`} loading="lazy" /> : <div className="vehicle-image-placeholder" aria-label="تصویر موجود نیست">LUX MOTORS</div>}<div><h2>{p.name}</h2><p className="vehicle-card-model">{[p.model || p.trim, p.model_year].filter(Boolean).join(' · ')}</p><b>{new Intl.NumberFormat('fa-IR').format(p.price)} تومان</b></div></a>)}</div> : <div className="empty-store"><span className="empty-icon"><PackageSearch size={28} strokeWidth={1.4} /></span><span className="eyebrow">موجودی لوکس موتورز</span><h2>{query ? `برای «${query}» خودرویی پیدا نشد.` : 'خودروی منتشرشده‌ای برای نمایش وجود ندارد.'}</h2><p>برای هر خودرو تصویر، نام، مدل، سال و قیمت را ببینید؛ سایر مشخصات در صفحه جزئیات آمده است.</p><a href="/" className="text-link">بازگشت به خانه <span>←</span></a></div>}<span className="result-count">{new Intl.NumberFormat('fa-IR').format(visible.length)} محصول</span></div>
    </div>
  </div>;
}