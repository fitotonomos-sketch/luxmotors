
import type { APIRoute } from 'astro';

const productionRobotsTxt = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /modiriyatfrosh',
  'Disallow: /cart',
  'Disallow: /checkout',
  'Disallow: /payment',
  'Disallow: /auth/',
].join('\n');

const stagingRobotsTxt = [
  'User-agent: *',
  'Disallow: /',
].join('\n');

export const GET: APIRoute = ({ site }) => {
  const configuredUrl =
    import.meta.env.PUBLIC_SITE_URL ||
    site?.origin ||
    'https://luxmotors.onrender.com';

  const siteUrl = new URL(configuredUrl);
  const preview = import.meta.env.PUBLIC_IS_PREVIEW === 'true';

  let body = preview
    ? stagingRobotsTxt
    : productionRobotsTxt;

  if (!preview) {
    body += `\n\nSitemap: ${new URL('/sitemap-index.xml', siteUrl).href}\n`;

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;

    if (supabaseUrl) {
      const dynamicSitemap = new URL(
        '/functions/v1/public-sitemap',
        supabaseUrl
      );

      dynamicSitemap.searchParams.set('site', siteUrl.origin);

      body += `Sitemap: ${dynamicSitemap.href}\n`;
    }
  }

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
