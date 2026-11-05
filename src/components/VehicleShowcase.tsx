import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
type Vehicle = { id: string; name: string; slug: string; model: string; model_year: number | null; trim: string; price: number; image_url: string };
export default function VehicleShowcase() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!supabase) { setError('دریافت موجودی در دسترس نیست.'); setLoading(false); return; }
    supabase.from('products').select('id,name,slug,model,model_year,trim,price,image_url').eq('published', true).order('created_at', { ascending: false }).limit(8).then(({ data, error: queryError }) => {
      if (queryError) setError('بارگذاری خودروها با مشکل روبه‌رو شد.');
      else setVehicles((data || []) as Vehicle[]);
      setLoading(false);
    });
  }, []);
  if (loading) return <p className="vehicle-showcase-state" role="status">در حال بارگذاری خودروها…</p>;
  if (error) return <p className="vehicle-showcase-state" role="alert">{error}</p>;
  if (!vehicles.length) return <p className="vehicle-showcase-state">هنوز خودروی منتشرشده‌ای موجود نیست.</p>;
  return <div className="lux-car-grid">{vehicles.map(vehicle => <a className="lux-car-card showcase-card" key={vehicle.id} href={`/products?slug=${encodeURIComponent(vehicle.slug)}`} aria-label={`مشاهده جزئیات ${vehicle.name}`}>
    <div className="lux-car-image">{vehicle.image_url ? <img src={vehicle.image_url} alt={`${vehicle.name}${vehicle.model_year ? ` مدل ${vehicle.model_year}` : ''}`} loading="lazy"/> : <div className="vehicle-image-placeholder">LUX MOTORS</div>}</div>
    <div className="lux-car-info"><span className="vehicle-card-model">{[vehicle.model || vehicle.trim, vehicle.model_year && `مدل ${vehicle.model_year}`].filter(Boolean).join(' · ')}</span><h3>{vehicle.name}</h3><b className="vehicle-card-price">{new Intl.NumberFormat('fa-IR').format(vehicle.price)} تومان</b></div>
  </a>)}</div>;
}
