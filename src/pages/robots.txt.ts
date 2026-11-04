import type { APIRoute } from 'astro';
import b12Context from '../b12Context.json';

const productionRobotsTxt = `User-agent: *\nAllow: /\nDisallow: /modiriyatfrosh\nDisallow: /cart\nDisallow: /checkout\nDisallow: /payment\nDisallow: /auth/\n`;
const stagingRobotsTxt = `User-agent: *\nDisallow: /\n`;

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin || import.meta.env.PUBLIC_SITE_URL || b12Context.website_url;
  const siteUrl = new URL(origin);
  const sitemapURL = new URL('/sitemap-index.xml', siteUrl);
  const preview = import.meta.env.PUBLIC_IS_PREVIEW === 'true' || (!import.meta.env.PUBLIC_SITE_URL && b12Context.is_preview);
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const sitemapFunction = !preview && supabaseUrl
    ? new URL('/functions/v1/public-sitemap', supabaseUrl)
    : null;
  if (sitemapFunction) sitemapFunction.searchParams.set('site', siteUrl.origin);
  const body = `${preview ? stagingRobotsTxt : productionRobotsTxt}\nSitemap: ${sitemapURL.href}\n${sitemapFunction ? `Sitemap: ${sitemapFunction.href}\n` : ''}`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
