---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import RequiredB12HeadScripts from '../components/RequiredB12HeadScripts.astro';
import RequiredB12FooterScripts from '../components/RequiredB12FooterScripts.astro';
import PublicMetaSync from '../components/PublicBrand';
import SiteCopySync from '../components/SiteCopySync';
import HeroBannerSync from '../components/HeroBannerSync';
import WhatsAppFloat from '../components/WhatsAppFloat';
import PurchaseGuide from '../components/PurchaseGuide';
const { title = 'لوکس موتورز | خودروهای وارداتی منطقه آزاد', description = 'خودروهای وارداتی منتخب لوکس موتورز.' } = Astro.props;
const canonicalBase = import.meta.env.PUBLIC_SITE_URL || Astro.site?.origin || Astro.url.origin;
const canonicalPath = ['/products', '/categories'].includes(Astro.url.pathname) ? `${Astro.url.pathname}${Astro.url.search}` : Astro.url.pathname;
const canonicalHref = new URL(canonicalPath, canonicalBase).href;
---
<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <meta name="robots" content="index,follow" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={Astro.url.href} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <link rel="canonical" href={canonicalHref} />
    <script type="application/ld+json" set:html={JSON.stringify({ '@context': 'https://schema.org', '@type': 'Store', name: title, description, url: Astro.url.origin })} />
    <meta name="theme-color" content="#171716" />
    <title>{title}</title>
    <link rel="preconnect" href="https://cdn.b12.io" crossorigin />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <RequiredB12HeadScripts />
  </head>
  <body>
    <PublicMetaSync client:load />
    <SiteCopySync client:load />
    <HeroBannerSync client:load />
    <Header />
    <WhatsAppFloat client:load />
    <PurchaseGuide client:load />
    <main><slot /></main>
    <Footer />
    <RequiredB12FooterScripts />
  </body>
</html>
