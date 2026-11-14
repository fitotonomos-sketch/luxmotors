
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { supabase } from '../lib/supabase';

type Asset = {
  id: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  file_size: number;
};

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  desktop_image: string;
  mobile_image: string | null;
  link: string | null;
  animation_type: 'fade' | 'slide';
  display_order: number;
  is_active: boolean;
};

type SiteContent = {
  id?: number;
  site_name?: string;
  tagline?: string;
  contact_info?: Record<string, string>;
  footer_content?: string;
  social_links?: Record<string, string>;
  logo_path?: string | null;
  favicon_path?: string | null;
  og_image_path?: string | null;
  hero_image_path?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_url?: string | null;
  robots?: string;
  page_copy?: Record<string, string>;
  [key: string]: any;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image_path?: string | null;
  canonical_url?: string | null;
  robots?: string | null;
  [key: string]: any;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image_path?: string | null;
  canonical_url?: string | null;
  robots?: string | null;
  [key: string]: any;
};

type StudioForm = {
  title: string;
  subtitle: string;
  desktop_image: string;
  mobile_image: string;
  link: string;
  animation_type: 'fade' | 'slide';
  display_order: number | string;
  is_active: boolean;
};

const blankBanner: StudioForm = {
  title: '',
  subtitle: '',
  desktop_image: '',
  mobile_image: '',
  link: '',
  animation_type: 'fade',
  display_order: 0,
  is_active: false
};

const DEFAULT_PAGE_COPY: Record<string, string> = {
  'header.announcement': 'خودروهای وارداتی ممتاز · منطقه آزاد',
  'header.announcement_link': 'مشاهده مجموعه',
  'nav.home': 'خانه',
  'nav.featured': 'خودروهای منتخب',
  'nav.store': 'موجودی فروشگاه',
  'nav.about': 'درباره ما',
  'nav.cars': 'خودروها',
  'nav.cart': 'سبد سفارش',
  'floating.whatsapp': 'مشاوره واتساپی',
  'hero.eyebrow': 'LUX MOTORS · FREE ZONE',
  'hero.title': 'وقارِ حرکت،',
  'hero.title_emphasis': 'فراتر از مسیر.',
  'hero.description':
    'گزیده‌ای از خودروهای وارداتی ممتاز؛ برای کسانی که کیفیت را در هر جزئیات می‌شناسند.',
  'hero.cta': 'کشف مجموعه خودروها',
  'hero.note': 'انتخاب ممتاز · همراهی شفاف · تجربه‌ای شخصی',
  'about.eyebrow': 'فراتر از یک انتخاب',
  'about.title': 'ترکیب مهندسی پیشرفته، طراحی ماندگار و',
  'about.emphasis': 'آزادیِ انتخاب.',
  'about.signature': 'لوکس موتورز · منطقه آزاد',
  'featured.eyebrow': 'منتخب لوکس موتورز',
  'featured.title': 'خودروهایی برای تمایز.',
  'featured.link': 'مشاهده همه خودروها ←',
  'featured.disclaimer':
    'مشخصات و قیمت‌های نمونه نمایشی فرضی‌اند؛ اطلاعات خودروی واقعی را پیش از خرید استعلام و کارشناسی کنید.',
  'services.eyebrow': 'جزئیات، همان تفاوت‌اند',
  'services.item1.title': 'انتخاب دقیق',
  'services.item1.body': 'تمرکز بر خودروهای شاخص و نسخه‌های ممتاز.',
  'services.item2.title': 'اطلاعات شفاف',
  'services.item2.body':
    'وضعیت هر خودروی واقعی باید با گزارش کارشناسی و اسناد معتبر تأیید شود.',
  'services.item3.title': 'همراهی اختصاصی',
  'services.item3.body':
    'برای دریافت اطلاعات موجودی و مشاوره با ما در تماس باشید.',
  'footer.description':
    'خودروهای وارداتی منتخب، با نگاهی دقیق به طراحی، مهندسی و کیفیت.',
  'footer.guide': 'راهنمای خرید',
  'footer.store': 'فروشگاه',
  'footer.vehicles': 'خودروهای منتخب',
  'footer.support': 'همراه شما',
  'footer.about': 'درباره لوکس موتورز',
  'footer.consult': 'درخواست مشاوره',
  'footer.disclaimer': 'مشخصات و موجودی با استعلام تأیید می‌شود',
  'footer.brand_eyebrow': 'LUX MOTORS · FREE ZONE',
  'footer.brand_tagline': 'وقارِ حرکت، فراتر از مسیر.',
  'footer.copyright_note': 'خودروهای وارداتی منطقه آزاد',
  'footer.copyright': '© ۱۴۰۵ لوکس موتورز · تمام حقوق محفوظ است.',
  'product.back': '← بازگشت به خودروها',
  'product.eyebrow': 'LUX MOTORS · پرونده خودرو',
  'product.cta': 'افزودن به فهرست انتخاب‌ها',
  'product.about_eyebrow': 'معرفی خودرو',
  'product.about_title': 'درباره این خودرو',
  'product.specs_eyebrow': 'مشخصات',
  'product.specs_title': 'مشخصات فنی و وضعیت',
  'product.options_eyebrow': 'تجهیزات',
  'product.options_title': 'آپشن‌ها و امکانات',
  'product.disclaimer':
    'اطلاعات آگهی، کارکرد، وضعیت بدنه، سلامت، مدارک و گمرک را پیش از هر معامله با بازدید حضوری و کارشناسی مستقل بررسی کنید.',
  'store.eyebrow': 'انتخاب‌های لوکس موتورز',
  'store.title': 'خودروهای منتخب',
  'store.description': 'موجودی و اطلاعات خودروهای منتشرشده را بررسی کنید.',
  'store.disclaimer': 'خودروها و قیمت‌های نمونه صرفاً نمایشی و فرضی هستند.'
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/x-icon',
  'image/vnd.microsoft.icon'
]);

const ALLOWED_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
  'ico'
]);

const publicUrl = (path: string) => {
  if (!path || !supabase) return '';

  if (/^https?:\/\//i.test(path)) return path;

  const { data } = supabase.storage.from('site-media').getPublicUrl(path);

  return data?.publicUrl || '';
};

const assetUrl = (path: string) => publicUrl(path);

const assetPath = (value: string) => {
  if (!value) return '';

  const marker = '/storage/v1/object/public/site-media/';

  if (value.includes(marker)) {
    return value.split(marker)[1].split('?')[0];
  }

  return value;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat('fa-IR').format(value);

const errorMessage = (error: any) =>
  error?.message || error?.error_description || 'خطای ناشناخته';

export default function AdminStudio({
  section
}: {
  section: string;
}) {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [main, setMain] = useState(false);
  const [canManageMedia, setCanManageMedia] = useState(false);
  const [canManageCategories, setCanManageCategories] = useState(false);

  const [message, setMessage] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [content, setContent] = useState<SiteContent>({});
  const [pageCopyText, setPageCopyText] = useState('{}');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [banner, setBanner] = useState<StudioForm>(blankBanner);
  const [editingBanner, setEditingBanner] = useState<string | null>(null);
  const [guideSections, setGuideSections] = useState<any[]>([]);
  const [guideDraft, setGuideDraft] = useState({ id: '', title: '', body: '', display_order: 0, is_published: true });

  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [productId, setProductId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [seo, setSeo] = useState<any>({});

  const [logs, setLogs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  async function refreshAssets(): Promise<boolean> {
    if (!supabase) {
      setMessage('اتصال پایگاه داده در دسترس نیست.');
      return false;
    }

    const { data, error } = await supabase
      .from('media_assets')
      .select('id, storage_path, original_name, mime_type, file_size')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Media Library] Read failed:', error);

      setMessage(
        `خواندن کتابخانه ناموفق بود: ${error.message} | کد: ${
          error.code || 'نامشخص'
        }`
      );

      return false;
    }

    setAssets((data || []) as Asset[]);
    return true;
  }

  async function load() {
    if (!supabase) {
      setMessage('اتصال پایگاه داده در دسترس نیست.');
      setReady(true);
      return;
    }

    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(`خطای احراز هویت: ${authError.message}`);
      }

      if (!user?.email) {
        window.location.href = '/modiriyatfrosh';
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('role, permissions')
        .eq('email', user.email)
        .maybeSingle();

      if (adminError) {
        throw new Error(`خواندن دسترسی مدیر ناموفق بود: ${adminError.message}`);
      }

      if (!admin) {
        setMessage('این حساب اجازه مدیریت ندارد.');
        setReady(true);
        return;
      }

      const required =
        section === 'media'
          ? 'media.manage'
          : section === 'banners'
            ? 'banners.manage'
            : section === 'content' || section === 'guide'
              ? 'content.manage'
              : section === 'seo-categories'
                ? 'categories.manage'
                : section.startsWith('seo-')
                  ? 'seo.manage'
                  : section === 'audit'
                    ? 'admins.manage'
                    : 'products.manage';

      if (
        admin.role === 'subadmin' &&
        !admin.permissions?.includes(required) &&
        !(
          section === 'seo-categories' &&
          admin.permissions?.includes('seo.manage')
        )
      ) {
        setMessage('برای این بخش دسترسی مدیر اصلی به شما داده نشده است.');
        setReady(true);
        return;
      }

      if (section === 'audit' && admin.role !== 'main') {
        setMessage('گزارش ممیزی فقط برای مدیر اصلی در دسترس است.');
        setReady(true);
        return;
      }

      setAllowed(true);
      setMain(admin.role === 'main');
      setCanManageMedia(admin.role !== 'subadmin' || !!admin.permissions?.includes('media.manage'));
      setCanManageCategories(admin.role !== 'subadmin' || !!admin.permissions?.includes('categories.manage'));

      const [c, b, p, cats, a, inv] = await Promise.all([
        supabase.from('site_content').select('*').eq('id', 1).maybeSingle(),

        supabase.from('banners').select('*').order('display_order'),

        supabase
          .from('products')
          .select(
            'id, name, slug, seo_title, seo_description, seo_image_path, canonical_url, robots'
          ),

        supabase.from('categories').select('*').order('name'),

        admin.role === 'main'
          ? supabase
              .from('audit_logs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(100)
          : Promise.resolve({ data: [], error: null }),

        section === 'audit'
          ? supabase
              .from('products')
              .select('id, name, category, price, stock, published')
              .order('name')
          : Promise.resolve({ data: [], error: null })
      ]);

      if (c.error) {
        setMessage(`خواندن تنظیمات سایت ناموفق بود: ${c.error.message}`);
      }

      if (b.error) {
        console.error('[Admin Studio] Banner read failed:', b.error);
      }

      if (p.error) {
        console.error('[Admin Studio] Product read failed:', p.error);
      }

      if (cats.error) {
        console.error('[Admin Studio] Category read failed:', cats.error);
      }

      if (section === 'audit' && inv.error) {
        setMessage('خواندن موجودی برای گزارش ناموفق بود.');
      }

      setContent(c.data || {});

      setPageCopyText(
        JSON.stringify(
          {
            ...DEFAULT_PAGE_COPY,
            ...(c.data?.page_copy || {})
          },
          null,
          2
        )
      );

      setBanners((b.data || []) as Banner[]);
      setProducts((p.data || []) as Product[]);
      setCategories((cats.data || []) as Category[]);
      setLogs(a.data || []);
      setInventory(inv.data || []);

      if (p.data?.length) {
        setProductId(p.data[0].id);
        setSeo(p.data[0]);
      }

      if (cats.data?.length) {
        setCategoryId(cats.data[0].id);
        if (!p.data?.length) setSeo(cats.data[0]);
      }

      if (section === 'guide') {
        const { data: guideData, error: guideError } = await supabase.from('purchase_guide_sections').select('*').order('display_order').order('created_at');
        if (guideError) setMessage(`خواندن راهنمای خرید ناموفق بود: ${guideError.message}`);
        setGuideSections(guideData || []);
      }
      if (
        ['media', 'banners', 'content', 'seo-products', 'seo-categories'].includes(section) &&
        (admin.role === 'main' || admin.permissions?.includes('media.manage'))
      ) {
        await refreshAssets();
      }
    } catch (error: any) {
      console.error('[Admin Studio] Initialization failed:', error);
      setMessage(errorMessage(error));
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const product = useMemo(
    () => products.find(item => item.id === productId),
    [products, productId]
  );

  const category = useMemo(
    () => categories.find(item => item.id === categoryId),
    [categories, categoryId]
  );

  function updatePageCopy(key: string, value: string) {
    try {
      const current = JSON.parse(pageCopyText || '{}');

      setPageCopyText(
        JSON.stringify(
          {
            ...current,
            [key]: value
          },
          null,
          2
        )
      );
    } catch {
      setMessage('ابتدا ساختار JSON را اصلاح کنید؛ سپس متن‌ها را ویرایش کنید.');
    }
  }

  async function audit(
    action: string,
    entity: string,
    id: string | null,
    metadata: any = {}
  ) {
    // Database triggers record authenticated mutations. Do not accept client-authored
    // audit rows: a browser could forge records for actions that never happened.
    void action;
    void entity;
    void id;
    void metadata;
  }

  async function upload(file?: File, applyAsLogo = false, applyAsHero = false) {
    if (!file || !supabase) {
      if (!supabase) setMessage('اتصال Supabase در دسترس نیست.');
      return;
    }

    if (busy) {
      setMessage('یک آپلود دیگر در حال انجام است؛ صبر کن.');
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!file.size || file.size > MAX_IMAGE_SIZE) {
      setMessage('حجم فایل باید بیشتر از صفر و حداکثر ۱۰ مگابایت باشد.');
      return;
    }

    if (
      !ALLOWED_IMAGE_TYPES.has(file.type) ||
      !ALLOWED_EXTENSIONS.has(extension)
    ) {
      setMessage(
        `نوع تصویر پشتیبانی نمی‌شود. نوع فایل: ${file.type || 'نامشخص'}`
      );
      return;
    }

    setBusy(true);

    let uploadedPath: string | null = null;
    let databaseRecordCreated = false;

    try {
      setMessage('در حال بررسی نشست کاربر…');

      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) throw new Error(authError.message);
      if (!user) throw new Error('نشست ورود معتبر نیست؛ دوباره وارد شو.');

      const digest = await crypto.subtle.digest(
        'SHA-256',
        await file.arrayBuffer()
      );

      const hash = Array.from(new Uint8Array(digest))
        .map(value => value.toString(16).padStart(2, '0'))
        .join('');

      const path = `${user.id}/${hash}.${extension}`;

      setMessage('در حال بررسی فایل تکراری…');

      const { data: existing, error: lookupError } = await supabase
        .from('media_assets')
        .select('id, storage_path, original_name, mime_type, file_size')
        .eq('storage_path', path)
        .maybeSingle();

      if (lookupError) {
        throw new Error(
          `خواندن رکورد رسانه ناموفق بود: ${lookupError.message}`
        );
      }

      if (existing) {
        setMessage('این تصویر قبلاً در کتابخانه ثبت شده است.');

        await refreshAssets();

        if (applyAsLogo) {
          setContent(current => ({
            ...current,
            logo_path: existing.storage_path
          }));

          await applyBrand(existing.storage_path, 'logo_path');
        }
        if (applyAsHero) {
          setContent(current => ({ ...current, hero_image_path: existing.storage_path }));
          await applyHeroImage(existing.storage_path);
        }

        return;
      }

      setMessage('در حال ارسال تصویر به Supabase Storage…');

      const { data: stored, error: storageError } = await supabase.storage
        .from('site-media')
        .upload(path, file, {
          upsert: false,
          contentType: file.type,
          cacheControl: '3600'
        });

      if (storageError) {
        throw new Error(`خطای Storage: ${storageError.message}`);
      }

      uploadedPath = stored.path;

      setMessage('تصویر آپلود شد؛ در حال ثبت در کتابخانه…');

      const { data: record, error: insertError } = await supabase
        .from('media_assets')
        .insert({
          storage_path: uploadedPath,
          original_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          created_by: user.id
        })
        .select('id, storage_path, original_name, mime_type, file_size')
        .single();

      if (insertError) {
        throw new Error(
          `آپلود انجام شد، اما ثبت کتابخانه شکست خورد: ${insertError.message}`
        );
      }

      databaseRecordCreated = true;

      setAssets(current => [
        record as Asset,
        ...current.filter(item => item.id !== record.id)
      ]);

      setMessage(`تصویر «${file.name}» با موفقیت به کتابخانه اضافه شد.`);

      await audit('upload', 'media_asset', record.id, {
        original_name: file.name,
        storage_path: record.storage_path,
        file_size: file.size
      });

      if (applyAsLogo) {
        setContent(current => ({
          ...current,
          logo_path: record.storage_path
        }));

        await applyBrand(record.storage_path, 'logo_path');
      }
      if (applyAsHero) {
        setContent(current => ({ ...current, hero_image_path: record.storage_path }));
        await applyHeroImage(record.storage_path);
      }
    } catch (error: any) {
      console.error('[Media Upload] Error:', error);

      let detail = errorMessage(error);

      if (uploadedPath && !databaseRecordCreated) {
        const { error: cleanupError } = await supabase.storage
          .from('site-media')
          .remove([uploadedPath]);

        if (cleanupError) {
          console.error('[Media Upload] Cleanup failed:', cleanupError);

          detail +=
            ' پاک‌سازی فایل ناقص هم ناموفق بود؛ Storage را بررسی کن.';
        } else {
          detail += ' فایل ناقص پاک شد.';
        }
      }

      setMessage(`خطای بارگذاری: ${detail}`);
    } finally {
      setBusy(false);
    }
  }

  async function applyBrand(
    path: string,
    field: 'logo_path' | 'favicon_path' | 'og_image_path'
  ) {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('site_content')
        .update({
          [field]: path || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select(`id, ${field}`)
        .single();

      if (error) throw error;
      if (!data) throw new Error('رکورد محتوای سایت پیدا نشد.');

      const savedPath = (data as any)[field] as string | null;

      setContent(current => ({
        ...current,
        [field]: savedPath
      }));

      if (field === 'logo_path') {
        window.dispatchEvent(
          new CustomEvent('lux-brand-updated', {
            detail: { logo_path: savedPath }
          })
        );
      }

      setMessage(
        field === 'logo_path'
          ? 'لوگو ذخیره شد. صفحه را تازه‌سازی کن تا نمایش نهایی را بررسی کنی.'
          : 'تصویر با موفقیت ذخیره شد.'
      );

      await audit('update', 'site_content', String(data.id), {
        field,
        path: savedPath
      });
    } catch (error: any) {
      console.error('[Brand Update] Failed:', error);
      setMessage(`اعمال تصویر ناموفق بود: ${errorMessage(error)}`);
    }
  }

  async function applyHeroImage(path: string) {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('site_content')
        .update({
          hero_image_path: path || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;

      setContent(current => ({
        ...current,
        hero_image_path: path || null
      }));

      window.dispatchEvent(
        new CustomEvent('lux-hero-updated', {
          detail: { hero_image_path: path || null }
        })
      );

      setMessage('تصویر بنر اصلی ذخیره شد.');
    } catch (error: any) {
      setMessage(`ذخیره بنر ناموفق بود: ${errorMessage(error)}`);
    }
  }

  async function removeAsset(asset: Asset) {
    if (!supabase) return;

    try {
      setBusy(true);

      const [p, b, c, s] = await Promise.all([
        supabase
          .from('products')
          .select('image_url, seo_image_path, gallery_images')
          .limit(1000),

        supabase
          .from('banners')
          .select('desktop_image, mobile_image')
          .limit(1000),

        supabase
          .from('site_content')
          .select('logo_path, favicon_path, og_image_path, hero_image_path')
          .eq('id', 1),

        supabase
          .from('site_settings')
          .select('logo_path, favicon_path, og_image_path')
          .eq('id', 1)
      ]);

      if (p.error || b.error || c.error || s.error) {
        throw new Error(
          'بررسی وابستگی‌های فایل کامل نشد؛ برای جلوگیری از حذف اشتباه، فایل حذف نشد.'
        );
      }

      const values = [
        ...(p.data || []).flatMap((item: any) =>
          Object.values(item).flatMap(value =>
            Array.isArray(value) ? value : [value]
          )
        ),
        ...(b.data || []).flatMap((item: any) => Object.values(item)),
        ...(c.data || []).flatMap((item: any) => Object.values(item)),
        ...(s.data || []).flatMap((item: any) => Object.values(item))
      ]
        .filter(Boolean)
        .map(String);

      if (
        values.some(value => {
          const normalized = assetPath(value);
          return (
            normalized === asset.storage_path ||
            normalized.includes(asset.storage_path)
          );
        })
      ) {
        setMessage('این فایل هنوز در بخش دیگری از سایت استفاده می‌شود.');
        return;
      }

      const { error: storageError } = await supabase.storage
        .from('site-media')
        .remove([asset.storage_path]);

      if (storageError) throw storageError;

      const { error: rowError } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', asset.id);

      if (rowError) {
        throw new Error(
          `فایل حذف شد اما حذف رکورد کتابخانه ناموفق بود: ${rowError.message}`
        );
      }

      setAssets(current => current.filter(item => item.id !== asset.id));
      setMessage('رسانه با موفقیت حذف شد.');

      await audit('delete', 'media_asset', asset.id, {
        storage_path: asset.storage_path
      });
    } catch (error: any) {
      console.error('[Media Delete] Failed:', error);
      setMessage(`حذف رسانه ناموفق بود: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function saveGuideSection(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;
    const title = guideDraft.title.trim();
    const body = guideDraft.body.trim();
    if (!title || title.length > 120 || !body || body.length > 5000) { setMessage('عنوان را تا ۱۲۰ و متن را تا ۵۰۰۰ نویسه وارد کنید.'); return; }
    setBusy(true);
    try {
      const payload = { title, body, display_order: Number(guideDraft.display_order) || 0, is_published: guideDraft.is_published, updated_at: new Date().toISOString() };
      const result = guideDraft.id ? await supabase.from('purchase_guide_sections').update(payload).eq('id', guideDraft.id).select('*').single() : await supabase.from('purchase_guide_sections').insert(payload).select('*').single();
      if (result.error) throw result.error;
      setGuideSections(current => [...current.filter(item => item.id !== result.data.id), result.data].sort((a,b) => a.display_order - b.display_order));
      setGuideDraft({ id: '', title: '', body: '', display_order: 0, is_published: true });
      setMessage('بخش راهنمای خرید ذخیره شد.');
    } catch (error: any) { setMessage(`ذخیره بخش راهنما ناموفق بود: ${errorMessage(error)}`); }
    finally { setBusy(false); }
  }

  async function deleteGuideSection(id: string) {
    if (!supabase || !window.confirm('این بخش از راهنمای خرید حذف شود؟')) return;
    const { error } = await supabase.from('purchase_guide_sections').delete().eq('id', id);
    if (error) setMessage(`حذف بخش ناموفق بود: ${errorMessage(error)}`);
    else { setGuideSections(current => current.filter(item => item.id !== id)); setMessage('بخش راهنما حذف شد.'); }
  }

  async function saveContent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    let page_copy: Record<string, string>;

    try {
      page_copy = JSON.parse(pageCopyText || '{}');

      if (
        !page_copy ||
        Array.isArray(page_copy) ||
        typeof page_copy !== 'object' ||
        Object.values(page_copy).some(value => typeof value !== 'string')
      ) {
        throw new Error();
      }
    } catch {
      setMessage('متن‌های صفحه باید JSON معتبر و شامل مقدارهای متنی باشند.');
      return;
    }

    const update = {
      site_name: content.site_name || 'لوکس موتورز',
      tagline: content.tagline || '',
      contact_info: content.contact_info || {},
      footer_content: content.footer_content || '',
      social_links: content.social_links || {},
      logo_path: content.logo_path || null,
      favicon_path: content.favicon_path || null,
      og_image_path: content.og_image_path || null,
      hero_image_path: content.hero_image_path || null,
      seo_title: content.seo_title || null,
      seo_description: content.seo_description || null,
      canonical_url: content.canonical_url || null,
      robots: content.robots || 'index,follow',
      page_copy,
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('site_content')
        .update(update)
        .eq('id', 1)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('رکورد site_content با شناسه ۱ پیدا نشد.');
      }

      window.dispatchEvent(
        new CustomEvent('lux-brand-updated', {
          detail: { logo_path: update.logo_path }
        })
      );

      window.dispatchEvent(
        new CustomEvent('lux-hero-updated', {
          detail: { hero_image_path: update.hero_image_path }
        })
      );

      setMessage('محتوا و نوشته‌های سایت ذخیره شد.');

      await audit('update', 'site_content', String(data.id));
    } catch (error: any) {
      setMessage(`ذخیره محتوا ناموفق بود: ${errorMessage(error)}`);
    }
  }

  async function saveBanner(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    if (!banner.desktop_image) {
      setMessage('ابتدا تصویر دسکتاپ بنر را انتخاب کن.');
      return;
    }

    const payload = {
      ...banner,
      desktop_image: assetPath(banner.desktop_image),
      mobile_image: assetPath(banner.mobile_image) || null,
      link: banner.link || null,
      display_order: Number(banner.display_order) || 0
    };

    try {
      const result = editingBanner
        ? await supabase
            .from('banners')
            .update(payload)
            .eq('id', editingBanner)
            .select('id')
            .maybeSingle()
        : await supabase.from('banners').insert(payload).select('id').single();

      if (result.error) throw result.error;
      if (!result.data) throw new Error('بنر ذخیره نشد.');

      setMessage('بنر ذخیره شد.');
      setBanner(blankBanner);
      setEditingBanner(null);

      await audit(
        editingBanner ? 'update' : 'create',
        'banner',
        String(result.data.id),
        { title: banner.title }
      );

      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order');

      if (error) throw error;

      setBanners((data || []) as Banner[]);
    } catch (error: any) {
      setMessage(`ذخیره بنر ناموفق بود: ${errorMessage(error)}`);
    }
  }

  async function deleteBanner(id: string) {
    if (!supabase) return;

    try {
      const { error } = await supabase.from('banners').delete().eq('id', id);

      if (error) throw error;

      setBanners(current => current.filter(item => item.id !== id));
      setMessage('بنر حذف شد.');

      await audit('delete', 'banner', id);
    } catch (error: any) {
      setMessage(`حذف بنر ناموفق بود: ${errorMessage(error)}`);
    }
  }

  async function saveSeo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    const target =
      section === 'seo-products'
        ? 'products'
        : section === 'seo-categories'
          ? 'categories'
          : '';

    const fields = {
      seo_title: seo.seo_title || null,
      seo_description: seo.seo_description || null,
      seo_image_path: assetPath(seo.seo_image_path || '') || null,
      canonical_url: seo.canonical_url || null,
      robots: seo.robots || 'index,follow'
    };

    try {
      if (target === 'products' && productId) {
        const { error } = await supabase
          .from('products')
          .update(fields)
          .eq('id', productId);

        if (error) throw error;

        setProducts(current =>
          current.map(item =>
            item.id === productId ? { ...item, ...fields } : item
          )
        );

        setMessage('سئوی محصول ذخیره شد.');
        await audit('update', 'product_seo', productId);
      } else if (target === 'categories' && categoryId) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: seo.name,
            slug: seo.slug,
            ...fields
          })
          .eq('id', categoryId);

        if (error) throw error;

        setCategories(current =>
          current.map(item =>
            item.id === categoryId ? { ...item, ...seo, ...fields } : item
          )
        );

        setMessage('سئوی دسته ذخیره شد.');
        await audit('update', 'category_seo', categoryId);
      }
    } catch (error: any) {
      setMessage(`ذخیره سئو ناموفق بود: ${errorMessage(error)}`);
    }
  }

  async function createCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: seo.name,
          slug: seo.slug,
          seo_title: seo.seo_title || null,
          seo_description: seo.seo_description || null,
          seo_image_path: assetPath(seo.seo_image_path || '') || null,
          canonical_url: seo.canonical_url || null,
          robots: seo.robots || 'index,follow'
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(current => [...current, data as Category]);
      setCategoryId(data.id);
      setSeo(data);
      setMessage('دسته ایجاد شد.');

      await audit('create', 'category', data.id);
    } catch (error: any) {
      setMessage(`ایجاد دسته ناموفق بود: ${errorMessage(error)}`);
    }
  }

  async function removeLogo() {
    await applyBrand('', 'logo_path');
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
    applyAsLogo = false,
    applyAsHero = false
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    // امکان انتخاب دوباره همان فایل
    input.value = '';

    if (file) void upload(file, applyAsLogo, applyAsHero);
  }

  const assetPicker = (
    value: string,
    onChange: (value: string) => void,
    label: string
  ) => (
    <label className="admin-asset-picker">
      {label}
      <select
        value={value || ''}
        onChange={event => onChange(event.target.value)}
      >
        <option value="">انتخاب از کتابخانه…</option>
        {assets.map(item => (
          <option key={item.id} value={item.storage_path}>
            {item.original_name}
          </option>
        ))}
      </select>
    </label>
  );

  const uploadControl = (
    label: string,
    applyAsLogo = false,
    applyAsHero = false
  ) => canManageMedia ? (
    <label className="button button-dark" style={{ cursor: busy ? 'wait' : 'pointer' }}>
      {busy ? 'در حال بارگذاری…' : label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/x-icon,image/vnd.microsoft.icon"
        hidden
        disabled={busy}
        onChange={event => handleFileChange(event, applyAsLogo, applyAsHero)}
      />
    </label>
  ) : <small className="admin-permission-note">برای بارگذاری تصویر، دسترسی مدیریت رسانه لازم است.</small>;

  if (!ready) {
    return (
      <section className="page-shell admin-gate" id="admin-studio">
        <h1>در حال بارگذاری پنل…</h1>
      </section>
    );
  }

  if (!allowed) {
    return (
      <section className="page-shell admin-gate" id="admin-studio">
        <h1>دسترسی مدیر</h1>
        <p>{message || 'ابتدا وارد پنل مدیر شوید.'}</p>
        <a className="button button-dark" href="/modiriyatfrosh">
          ورود مدیر
        </a>
      </section>
    );
  }

  let editableCopy: Record<string, string> = { ...DEFAULT_PAGE_COPY };

  try {
    editableCopy = {
      ...DEFAULT_PAGE_COPY,
      ...JSON.parse(pageCopyText || '{}')
    };
  } catch {
    // JSON نامعتبر در ویرایشگر پیشرفته حفظ می‌شود.
  }

  const liveBanner = banners.find(item => item.is_active);

  return (
    <section
      className="page-shell"
      id="admin-studio"
      dir="rtl"
      style={{ paddingBlock: 50 }}
    >
      <span className="eyebrow">مدیریت سایت</span>

      <h1>
        {section === 'media'
          ? 'کتابخانه رسانه'
          : section === 'banners'
            ? 'مدیریت بنرها'
            : section === 'content'
              ? 'محتوای عمومی'
              : section === 'guide'
                ? 'راهنمای مراحل خرید'
                : section === 'seo-products'
                ? 'سئوی محصولات'
                : section === 'seo-categories'
                  ? 'سئوی دسته‌بندی‌ها'
                  : 'گزارش رویدادها'}
      </h1>

      <nav
        style={{
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          marginBlock: 18
        }}
      >
        <a href="/modiriyatfrosh/media">رسانه</a>
        <a href="/modiriyatfrosh/banners">بنرها</a>
        <a href="/modiriyatfrosh/content">محتوا</a>
        <a href="/modiriyatfrosh/guide">راهنمای خرید</a>
        <a href="/modiriyatfrosh/seo-products">سئوی محصول</a>
        <a href="/modiriyatfrosh/seo-categories">سئوی دسته</a>
        {main && <a href="/modiriyatfrosh/audit">گزارش رویدادها</a>}
      </nav>

      {message && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: 12,
            marginBlock: 12,
            border: '1px solid #b9b9b9',
            borderRadius: 8,
            overflowWrap: 'anywhere'
          }}
        >
          {message}
        </div>
      )}

      {section === 'media' && (
        <>
          <div className="admin-current-assets">
            <article>
              <span className="eyebrow">لوگوی فعلی سایت</span>

              <div className="admin-current-logo">
                {content.logo_path ? (
                  <img
                    src={assetUrl(content.logo_path)}
                    alt="لوگوی فعلی سایت"
                    onError={event => {
                      event.currentTarget.hidden = true;
                      setMessage('تصویر لوگو بارگذاری نشد؛ مسیر و مجوز فایل را بررسی کن.');
                    }}
                  />
                ) : (
                  <span>لوگویی ثبت نشده</span>
                )}
              </div>

              {uploadControl('بارگذاری و اعمال لوگو از دستگاه', true)}

              {assetPicker(
                assetPath(content.logo_path || ''),
                value => setContent(current => ({ ...current, logo_path: value })),
                'انتخاب لوگوی جایگزین از کتابخانه'
              )}

              <button
                type="button"
                className="button button-dark"
                disabled={!content.logo_path || busy}
                onClick={() =>
                  void applyBrand(content.logo_path || '', 'logo_path')
                }
              >
                اعمال لوگوی انتخاب‌شده
              </button>

              <button
                type="button"
                className="button button-outline"
                disabled={!content.logo_path || busy}
                onClick={() => void removeLogo()}
              >
                حذف لوگوی فعلی
              </button>
            </article>

            <article>
              <span className="eyebrow">تصویر قهرمان صفحهٔ اصلی</span>

              <div className="admin-current-banner">
                {content.hero_image_path || liveBanner?.desktop_image ? (
                  <img
                    src={assetUrl(
                      content.hero_image_path ||
                        assetPath(liveBanner?.desktop_image || '')
                    )}
                    alt="بنر فعلی صفحه اصلی"
                    onError={event => {
                      event.currentTarget.hidden = true;
                      setMessage('تصویر بنر بارگذاری نشد؛ مسیر و مجوز فایل را بررسی کن.');
                    }}
                  />
                ) : (
                  <span>بنر اختصاصی ثبت نشده؛ تصویر پیش‌فرض نمایش داده می‌شود.</span>
                )}
              </div>

              {liveBanner && <small>بنر فعال: {liveBanner.title}</small>}

              {uploadControl('بارگذاری و اعمال تصویر قهرمان جدید', false, true)}

              {assetPicker(
                assetPath(content.hero_image_path || ''),
                value =>
                  setContent(current => ({
                    ...current,
                    hero_image_path: value
                  })),
                'ویرایش تصویر قهرمان با انتخاب از کتابخانه'
              )}

              <button
                type="button"
                className="button button-dark"
                disabled={!content.hero_image_path || busy}
                onClick={() =>
                  void applyHeroImage(content.hero_image_path || '')
                }
              >
                اعمال بنر انتخاب‌شده
              </button>

              <button
                type="button"
                className="button button-outline"
                disabled={busy}
                onClick={() => void applyHeroImage('')}
              >
                بازگشت به تصویر پیش‌فرض
              </button>
            </article>
          </div>

          <p>
            فرمت‌های JPEG، PNG، WebP، GIF، AVIF و ICO تا ۱۰ مگابایت پشتیبانی
            می‌شوند.
          </p>

          {uploadControl('بارگذاری تصویر از گالری دستگاه')}

          <button
            type="button"
            className="button button-outline"
            disabled={busy}
            onClick={() => void refreshAssets()}
          >
            تازه‌سازی کتابخانه
          </button>

          {busy && <p>در حال پردازش تصویر؛ صفحه را نبند.</p>}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))',
              gap: 16,
              marginTop: 24
            }}
          >
            {assets.map(item => (
              <article
                key={item.id}
                style={{ border: '1px solid #ddd', padding: 12 }}
              >
                <img
                  src={assetUrl(item.storage_path)}
                  alt={item.original_name}
                  style={{
                    width: '100%',
                    height: 140,
                    objectFit: 'contain'
                  }}
                  onError={event => {
                    event.currentTarget.hidden = true;
                    console.error(
                      '[Media Library] Image failed to load:',
                      item.storage_path
                    );
                  }}
                />

                <p style={{ overflowWrap: 'anywhere' }}>
                  {item.original_name}
                </p>

                <small>
                  {formatNumber(Math.ceil(Number(item.file_size) / 1024))} KB
                </small>

                <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void applyBrand(item.storage_path, 'logo_path')
                    }
                  >
                    اعمال لوگو
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void applyBrand(item.storage_path, 'favicon_path')
                    }
                  >
                    اعمال آیکون مرورگر
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void applyBrand(item.storage_path, 'og_image_path')
                    }
                  >
                    تصویر اشتراک‌گذاری
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void removeAsset(item)}
                  >
                    حذف در صورت عدم استفاده
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!assets.length && <p>هنوز تصویری در کتابخانه ثبت نشده است.</p>}
        </>
      )}

      {section === 'banners' && (
        <>
          <article className="admin-live-banner">
            <span className="eyebrow">تصویر پس‌زمینهٔ بخش قهرمان</span>
            <div className="admin-current-banner">
              {content.hero_image_path ? (
                <img
                  src={assetUrl(content.hero_image_path)}
                  alt="تصویر پس‌زمینهٔ فعلی بخش قهرمان"
                  onError={event => {
                    event.currentTarget.hidden = true;
                    setMessage('تصویر پس‌زمینه بارگذاری نشد؛ مسیر و مجوز فایل را بررسی کن.');
                  }}
                />
              ) : (
                <span>تصویر اختصاصی ثبت نشده؛ تصویر پیش‌فرض صفحه نمایش داده می‌شود.</span>
              )}
            </div>
            {uploadControl('بارگذاری و اعمال تصویر پس‌زمینهٔ جدید', false, true)}
            {assetPicker(
              assetPath(content.hero_image_path || ''),
              value => setContent(current => ({ ...current, hero_image_path: value })),
              'انتخاب تصویر پس‌زمینه از کتابخانه'
            )}
            <button
              type="button"
              className="button button-dark"
              disabled={!content.hero_image_path || busy}
              onClick={() => void applyHeroImage(content.hero_image_path || '')}
            >
              اعمال تصویر انتخاب‌شده
            </button>
            <button
              type="button"
              className="button button-outline"
              disabled={busy}
              onClick={() => void applyHeroImage('')}
            >
              بازگشت به تصویر پیش‌فرض
            </button>
          </article>

          <article className="admin-live-banner">
            <span className="eyebrow">بنر فعال فعلی</span>

            {liveBanner ? (
              <>
                <img
                  src={assetUrl(assetPath(liveBanner.desktop_image))}
                  alt={liveBanner.title}
                />

                <div>
                  <b>{liveBanner.title}</b>
                  <p>{liveBanner.subtitle || 'بدون زیرعنوان'}</p>

                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => {
                      setBanner({
                        ...liveBanner,
                        mobile_image: liveBanner.mobile_image || ''
                      });
                      setEditingBanner(liveBanner.id);
                    }}
                  >
                    ویرایش بنر فعال
                  </button>
                </div>
              </>
            ) : (
              <p>در حال حاضر بنری برای نمایش فعال نشده است.</p>
            )}
          </article>

          <form
            onSubmit={event => void saveBanner(event)}
            className="admin-banner-form"
          >
            <h2>{editingBanner ? 'ویرایش بنر' : 'افزودن بنر'}</h2>

            <label>
              عنوان بنر
              <input
                required
                value={banner.title}
                onChange={event =>
                  setBanner(current => ({
                    ...current,
                    title: event.target.value
                  }))
                }
              />
            </label>

            <label>
              زیرعنوان
              <input
                value={banner.subtitle}
                onChange={event =>
                  setBanner(current => ({
                    ...current,
                    subtitle: event.target.value
                  }))
                }
              />
            </label>

            {assetPicker(
              banner.desktop_image,
              value =>
                setBanner(current => ({
                  ...current,
                  desktop_image: value
                })),
              'تصویر دسکتاپ'
            )}

            {uploadControl('آپلود تصویر بنر')}

            {assetPicker(
              banner.mobile_image,
              value =>
                setBanner(current => ({
                  ...current,
                  mobile_image: value
                })),
              'تصویر موبایل (اختیاری)'
            )}

            {banner.desktop_image && (
              <figure className="admin-banner-form-preview">
                <img
                  src={assetUrl(assetPath(banner.desktop_image))}
                  alt="پیش‌نمایش بنر"
                />
                <figcaption>پیش‌نمایش بنر</figcaption>
              </figure>
            )}

            <label>
              پیوند مقصد
              <input
                type="url"
                value={banner.link}
                onChange={event =>
                  setBanner(current => ({
                    ...current,
                    link: event.target.value
                  }))
                }
              />
            </label>

            <label>
              نوع جابه‌جایی
              <select
                value={banner.animation_type}
                onChange={event =>
                  setBanner(current => ({
                    ...current,
                    animation_type: event.target.value as 'fade' | 'slide'
                  }))
                }
              >
                <option value="fade">محو</option>
                <option value="slide">لغزش</option>
              </select>
            </label>

            <label>
              ترتیب نمایش
              <input
                type="number"
                value={banner.display_order}
                onChange={event =>
                  setBanner(current => ({
                    ...current,
                    display_order: event.target.value
                  }))
                }
              />
            </label>

            <label>
              <input
                type="checkbox"
                checked={banner.is_active}
                onChange={event =>
                  setBanner(current => ({
                    ...current,
                    is_active: event.target.checked
                  }))
                }
              />
              فعال
            </label>

            <button className="button button-dark" disabled={busy}>
              ذخیره بنر
            </button>

            {editingBanner && (
              <button
                type="button"
                className="button button-outline"
                onClick={() => {
                  setBanner(blankBanner);
                  setEditingBanner(null);
                }}
              >
                لغو ویرایش
              </button>
            )}
          </form>

          <div>
            {banners.map(item => (
              <article key={item.id} className="admin-banner-item">
                <img
                  src={assetUrl(assetPath(item.desktop_image))}
                  alt={item.title}
                  style={{
                    width: 180,
                    height: 90,
                    objectFit: 'cover'
                  }}
                />

                <b>{item.title}</b>
                {' · '}
                {item.is_active ? 'فعال' : 'پیش‌نویس'}

                <button
                  type="button"
                  onClick={() => {
                    setBanner({
                      ...item,
                      mobile_image: item.mobile_image || ''
                    });
                    setEditingBanner(item.id);
                  }}
                >
                  ویرایش
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void deleteBanner(item.id)}
                >
                  حذف
                </button>
              </article>
            ))}
          </div>
        </>
      )}

      {section === 'guide' && <div className="purchase-guide-admin">
        <p>ترتیب کمتر، زودتر نمایش داده می‌شود.</p>
        <form className="glass-panel" onSubmit={event => void saveGuideSection(event)}>
          <h2>{guideDraft.id ? 'ویرایش بخش' : 'افزودن بخش جدید'}</h2>
          <label>نام بخش<input required maxLength={120} value={guideDraft.title} onChange={event => setGuideDraft(current => ({ ...current, title: event.target.value }))} /></label>
          <label>محتوای بخش<textarea required maxLength={5000} rows={6} value={guideDraft.body} onChange={event => setGuideDraft(current => ({ ...current, body: event.target.value }))} /></label>
          <label>ترتیب نمایش<input type="number" value={guideDraft.display_order} onChange={event => setGuideDraft(current => ({ ...current, display_order: Number(event.target.value) }))} /></label>
          <label><input type="checkbox" checked={guideDraft.is_published} onChange={event => setGuideDraft(current => ({ ...current, is_published: event.target.checked }))} /> نمایش عمومی</label>
          <button className="button button-dark" disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیره بخش'}</button>
          {guideDraft.id && <button type="button" className="button button-outline" onClick={() => setGuideDraft({ id: '', title: '', body: '', display_order: 0, is_published: true })}>لغو ویرایش</button>}
        </form>
        <div className="purchase-guide-admin-list">{guideSections.map((item, index) => <article className="glass-panel" key={item.id}><b>{index + 1}. {item.title}</b><p>{item.body}</p><small>{item.is_published ? 'منتشرشده' : 'پیش‌نویس'} · ترتیب {item.display_order}</small><div><button type="button" onClick={() => setGuideDraft({ id: item.id, title: item.title, body: item.body, display_order: item.display_order, is_published: item.is_published })}>ویرایش</button><button type="button" onClick={() => void deleteGuideSection(item.id)}>حذف</button></div></article>)}</div>
      </div>}

      {section === 'content' && (
        <form
          onSubmit={event => void saveContent(event)}
          style={{ display: 'grid', gap: 12, maxWidth: 700 }}
        >
          <fieldset className="admin-brand-picker">
            <legend>لوگوی سربرگ</legend>

            {content.logo_path ? (
              <img
                src={assetUrl(content.logo_path)}
                alt="لوگوی انتخاب‌شده"
              />
            ) : (
              <span>لوگویی ثبت نشده است.</span>
            )}

            {assetPicker(
              assetPath(content.logo_path || ''),
              value =>
                setContent(current => ({
                  ...current,
                  logo_path: value
                })),
              'انتخاب لوگو'
            )}

            {uploadControl('آپلود لوگو', true)}

            <button
              type="button"
              className="button button-outline"
              disabled={!content.logo_path || busy}
              onClick={() =>
                void applyBrand(content.logo_path || '', 'logo_path')
              }
            >
              اعمال لوگو
            </button>
          </fieldset>

          <label>
            نام سایت
            <input
              value={content.site_name || ''}
              onChange={event =>
                setContent(current => ({
                  ...current,
                  site_name: event.target.value
                }))
              }
            />
          </label>

          <label>
            شعار
            <input
              value={content.tagline || ''}
              onChange={event =>
                setContent(current => ({
                  ...current,
                  tagline: event.target.value
                }))
              }
            />
          </label>

          <label>
            ایمیل تماس
            <input
              type="email"
              value={content.contact_info?.email || ''}
              onChange={event =>
                setContent(current => ({
                  ...current,
                  contact_info: {
                    ...current.contact_info,
                    email: event.target.value
                  }
                }))
              }
            />
          </label>

          <label>
            تلفن
            <input
              value={content.contact_info?.phone || ''}
              onChange={event =>
                setContent(current => ({
                  ...current,
                  contact_info: {
                    ...current.contact_info,
                    phone: event.target.value
                  }
                }))
              }
            />
          </label>

          <label>
            متن پابرگ
            <textarea
              value={content.footer_content || ''}
              onChange={event =>
                setContent(current => ({
                  ...current,
                  footer_content: event.target.value
                }))
              }
            />
          </label>

          <label>
            اینستاگرام URL
            <input
              type="url"
              value={content.social_links?.instagram || ''}
              onChange={event =>
                setContent(current => ({
                  ...current,
                  social_links: {
                    ...current.social_links,
                    instagram: event.target.value
                  }
                }))
              }
            />
          </label>

          <label>
            تلگرام URL
            <input
              type="url"
              value={content.social_links?.telegram || ''}
              onChange={event =>
                setContent(current => ({
                  ...current,
                  social_links: {
                    ...current.social_links,
                    telegram: event.target.value
                  }
                }))
              }
            />
          </label>

          <label>
            واتساپ URL
            <input
              type="url"
              placeholder="https://wa.me/98912…"
              value={content.social_links?.whatsapp || ''}
              onChange={event =>
                setContent(current => ({
                  ...current,
                  social_links: {
                    ...current.social_links,
                    whatsapp: event.target.value
                  }
                }))
              }
            />
          </label>

          <label>
            عنوان SEO سایت
            <input
              value={content.seo_title || ''}
              onChange={event =>
                setContent(current => ({
                  ...current,
                  seo_title: event.target.value
                }))
              }
            />
          </label>

          <label>
            توضیحات SEO سایت
            <textarea
              value={content.seo_description || ''}
              onChange={event =>
                setContent(current => ({
                  ...current,
                  seo_description: event.target.value
                }))
              }
            />
          </label>

          <label>
            Canonical URL سایت
            <input
              type="url"
              value={content.canonical_url || ''}
              onChange={event =>
                setContent(current => ({
                  ...current,
                  canonical_url: event.target.value
                }))
              }
            />
          </label>

          <label>
            Robots سایت
            <select
              value={content.robots || 'index,follow'}
              onChange={event =>
                setContent(current => ({
                  ...current,
                  robots: event.target.value
                }))
              }
            >
              <option value="index,follow">index,follow</option>
              <option value="noindex,nofollow">noindex,nofollow</option>
              <option value="noindex,follow">noindex,follow</option>
            </select>
          </label>

          {assetPicker(
            assetPath(content.hero_image_path || ''),
            value =>
              setContent(current => ({
                ...current,
                hero_image_path: value
              })),
            'تصویر بنر اصلی'
          )}

          {uploadControl('آپلود بنر اصلی')}

          {assetPicker(
            assetPath(content.og_image_path || ''),
            value =>
              setContent(current => ({
                ...current,
                og_image_path: value
              })),
            'تصویر اشتراک‌گذاری / OG'
          )}

          {uploadControl('آپلود تصویر اشتراک‌گذاری')}

          <fieldset className="admin-copy-editor">
            <legend>ویرایش متن‌های سایت</legend>

            <p>
              متن هر بخش را ویرایش کن. برای نمایش در سایت، کامپوننت‌های
              نمایش محتوا نیز باید از کلیدهای page_copy استفاده کنند.
            </p>

            {Object.entries(editableCopy).map(([key, value]) => (
              <label className="admin-copy-field" key={key}>
                <span>{key.replace(/[._]/g, ' · ')}</span>

                {value.length > 95 ? (
                  <textarea
                    rows={3}
                    value={value}
                    onChange={event =>
                      updatePageCopy(key, event.target.value)
                    }
                  />
                ) : (
                  <input
                    value={value}
                    onChange={event =>
                      updatePageCopy(key, event.target.value)
                    }
                  />
                )}
              </label>
            ))}

            <details>
              <summary>ویرایش پیشرفته JSON</summary>

              <textarea
                rows={14}
                dir="ltr"
                spellCheck={false}
                value={pageCopyText}
                onChange={event => setPageCopyText(event.target.value)}
              />

              <small>مقادیر باید رشته‌های متنی و JSON معتبر باشند.</small>
            </details>
          </fieldset>

          <button className="button button-dark" disabled={busy}>
            ذخیره محتوای سایت
          </button>
        </form>
      )}

      {section === 'seo-products' && (
        <>
          <label>
            محصول
            <select
              value={productId}
              onChange={event => {
                const id = event.target.value;
                setProductId(id);
                setSeo(products.find(item => item.id === id) || {});
              }}
            >
              {products.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          {product && (
            <form
              onSubmit={event => void saveSeo(event)}
              style={{
                display: 'grid',
                gap: 12,
                maxWidth: 700,
                marginTop: 14
              }}
            >
              <label>
                عنوان SEO
                <input
                  value={seo.seo_title || ''}
                  onChange={event =>
                    setSeo((current: any) => ({
                      ...current,
                      seo_title: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                توضیحات SEO
                <textarea
                  value={seo.seo_description || ''}
                  onChange={event =>
                    setSeo((current: any) => ({
                      ...current,
                      seo_description: event.target.value
                    }))
                  }
                />
              </label>

              {assetPicker(
                assetPath(seo.seo_image_path || ''),
                value =>
                  setSeo((current: any) => ({
                    ...current,
                    seo_image_path: value
                  })),
                'تصویر SEO'
              )}

              {uploadControl('آپلود تصویر SEO')}

              <label>
                Canonical URL
                <input
                  type="url"
                  value={seo.canonical_url || ''}
                  onChange={event =>
                    setSeo((current: any) => ({
                      ...current,
                      canonical_url: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Robots
                <select
                  value={seo.robots || 'index,follow'}
                  onChange={event =>
                    setSeo((current: any) => ({
                      ...current,
                      robots: event.target.value
                    }))
                  }
                >
                  <option value="index,follow">index,follow</option>
                  <option value="noindex,nofollow">noindex,nofollow</option>
                  <option value="noindex,follow">noindex,follow</option>
                </select>
              </label>

              <button className="button button-dark" disabled={busy}>
                ذخیره SEO
              </button>

              <aside>
                <b>پیش‌نمایش نتیجه جست‌وجو</b>
                <h3>{seo.seo_title || product.name}</h3>
                <p>{seo.canonical_url || `/products/${encodeURIComponent(product.slug)}`}</p>
                <p>
                  {seo.seo_description ||
                    'توضیحات محصول در نتیجه جست‌وجو نمایش داده می‌شود.'}
                </p>
              </aside>
            </form>
          )}
        </>
      )}

      {section === 'seo-categories' && (
        <>
          <label>
            دسته‌بندی
            <select
              value={categoryId}
              onChange={event => {
                const id = event.target.value;
                setCategoryId(id);
                setSeo(categories.find(item => item.id === id) || {});
              }}
            >
              <option value="" disabled={!canManageCategories}>ایجاد دسته جدید / انتخاب دسته</option>

              {categories.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <form
            onSubmit={event =>
              categoryId ? void saveSeo(event) : void createCategory(event)
            }
            style={{
              display: 'grid',
              gap: 12,
              maxWidth: 700,
              marginTop: 14
            }}
          >
            <label>
              نام دسته
              <input
                required
                disabled={!!categoryId && !canManageCategories}
                value={seo.name || ''}
                onChange={event =>
                  setSeo((current: any) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
              />
            </label>

            <label>
              Slug
              <input
                required
                disabled={!!categoryId && !canManageCategories}
                value={seo.slug || ''}
                onChange={event =>
                  setSeo((current: any) => ({
                    ...current,
                    slug: event.target.value
                  }))
                }
              />
            </label>

            <label>
              عنوان SEO
              <input
                value={seo.seo_title || ''}
                onChange={event =>
                  setSeo((current: any) => ({
                    ...current,
                    seo_title: event.target.value
                  }))
                }
              />
            </label>

            <label>
              توضیحات SEO
              <textarea
                value={seo.seo_description || ''}
                onChange={event =>
                  setSeo((current: any) => ({
                    ...current,
                    seo_description: event.target.value
                  }))
                }
              />
            </label>

            {assetPicker(
              assetPath(seo.seo_image_path || ''),
              value =>
                setSeo((current: any) => ({
                  ...current,
                  seo_image_path: value
                })),
              'تصویر SEO'
            )}

            {uploadControl('آپلود تصویر دسته')}

            <label>
              Canonical URL
              <input
                type="url"
                value={seo.canonical_url || ''}
                onChange={event =>
                  setSeo((current: any) => ({
                    ...current,
                    canonical_url: event.target.value
                  }))
                }
              />
            </label>

            <label>
              Robots
              <select
                value={seo.robots || 'index,follow'}
                onChange={event =>
                  setSeo((current: any) => ({
                    ...current,
                    robots: event.target.value
                  }))
                }
              >
                <option value="index,follow">index,follow</option>
                <option value="noindex,nofollow">noindex,nofollow</option>
                <option value="noindex,follow">noindex,follow</option>
              </select>
            </label>

            <button className="button button-dark" disabled={busy || (!categoryId && !canManageCategories)}>
              {categoryId ? 'ذخیره SEO' : 'ایجاد دسته'}
            </button>

            <aside>
              <b>پیش‌نمایش نتیجه جست‌وجو</b>
              <h3>{seo.seo_title || seo.name}</h3>
              <p>{seo.canonical_url || `/categories?slug=${encodeURIComponent(seo.slug || '')}`}</p>
              <p>{seo.seo_description || 'توضیحات دسته‌بندی'}</p>
            </aside>
          </form>
        </>
      )}

      {section === 'audit' &&
        (main ? (
          <>
            <div className="inventory-report">
              <article>
                <span>تعداد مدل‌ها</span>
                <b>{formatNumber(inventory.length)}</b>
              </article>

              <article>
                <span>کل موجودی قابل شمارش</span>
                <b>
                  {formatNumber(
                    inventory.reduce(
                      (sum, item) =>
                        sum + Math.max(0, Number(item.stock) || 0),
                      0
                    )
                  )}{' '}
                  دستگاه
                </b>
              </article>

              <article>
                <span>ارزش اسمی انبار</span>
                <b>
                  {formatNumber(
                    inventory.reduce(
                      (sum, item) =>
                        sum +
                        Math.max(0, Number(item.stock) || 0) *
                          Math.max(0, Number(item.price) || 0),
                      0
                    )
                  )}{' '}
                  تومان
                </b>
              </article>

              <article>
                <span>منتشرشده / ناموجود</span>
                <b>
                  {formatNumber(inventory.filter(item => item.published).length)}
                  {' / '}
                  {formatNumber(
                    inventory.filter(item => Number(item.stock) <= 0).length
                  )}
                </b>
              </article>
            </div>

            <p className="inventory-report-note">
              ارزش انبار بر اساس تعداد موجودی × قیمت ثبت‌شده محاسبه می‌شود.
            </p>

            <h2>گزارش موجودی هر خودرو</h2>

            <div className="admin-report-table">
              <table>
                <thead>
                  <tr>
                    <th>خودرو</th>
                    <th>دسته</th>
                    <th>قیمت واحد</th>
                    <th>موجودی</th>
                    <th>ارزش موجودی</th>
                    <th>وضعیت انتشار</th>
                  </tr>
                </thead>

                <tbody>
                  {inventory.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.category || '—'}</td>
                      <td>{formatNumber(Number(item.price) || 0)} تومان</td>
                      <td>{formatNumber(Number(item.stock) || 0)}</td>
                      <td>
                        {formatNumber(
                          (Number(item.stock) || 0) *
                            (Number(item.price) || 0)
                        )}{' '}
                        تومان
                      </td>
                      <td>{item.published ? 'منتشرشده' : 'پیش‌نویس'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2>آخرین رویدادهای مدیریتی</h2>

            <div className="admin-report-table">
              <table>
                <thead>
                  <tr>
                    <th>زمان</th>
                    <th>مدیر</th>
                    <th>عمل</th>
                    <th>نوع</th>
                    <th>شناسه</th>
                    <th>جزئیات</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map(item => (
                    <tr key={item.id}>
                      <td>
                        {new Date(item.created_at).toLocaleString('fa-IR')}
                      </td>
                      <td>{item.admin_id || '—'}</td>
                      <td>{item.action}</td>
                      <td>{item.entity_type}</td>
                      <td>{item.entity_id}</td>
                      <td>
                        <code>{JSON.stringify(item.metadata)}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p>گزارش‌های موجودی و ممیزی فقط برای مدیر اصلی در دسترس است.</p>
        ))}
    </section>
  );
}
