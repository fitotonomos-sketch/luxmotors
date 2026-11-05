import { createClient } from '@supabase/supabase-js'
// Do not change these environment variable names — they are injected at build time via .env
const supabaseUrl = 'sb_publishable_Dx_YTNGWZaViecwk7nCzHw_xT7dbVAc'
const supabaseKey = 'egrdkzmzrqyjkwrapnms'
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured. Backends features will be unavailable.')
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null
