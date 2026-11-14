import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors"

const xmlEscape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
    // Published-only selects are protected by Supabase RLS; no service or private key is used.
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SB_PUBLISHABLE_KEY')!, options)
    const [{ data: products, error: productError }, { data: categories, error: categoryError }] = await Promise.all([
      supabase.from('products').select('slug,canonical_url,updated_at').eq('published', true).gt('stock', 0),
      supabase.from('categories').select('slug,canonical_url,updated_at').eq('is_published', true),
    ])
    if (productError || categoryError) throw productError || categoryError
    const requestedSite = new URL(req.url).searchParams.get('site')
    if (!requestedSite) throw new Error('Missing site base URL')
    const siteUrl = new URL(requestedSite)
    if (siteUrl.protocol !== 'https:') throw new Error('Only HTTPS site URLs are allowed')
    const origin = siteUrl.origin
    const productUrls = (products || []).map((p) => ({ loc: p.canonical_url || `${origin}/products/${encodeURIComponent(p.slug)}`, lastmod: p.updated_at }))
    const categoryUrls = (categories || []).map((c) => ({ loc: c.canonical_url || `${origin}/categories?slug=${encodeURIComponent(c.slug)}`, lastmod: c.updated_at }))
    const urls = [...productUrls, ...categoryUrls]
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}</url>`).join('')}</urlset>`
    return new Response(body, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Sitemap generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
