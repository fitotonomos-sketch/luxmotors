
import { createClient } from '@supabase/supabase-js'

// Lux Motors - Supabase Configuration
const supabaseUrl = 'https://egrdkzmzrqyjkwrapnms.supabase.co'
const supabaseKey = 'sb_publishable_Dx_YTNGWZaViecwk7nCzHw_xT7dbVAc'

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Supabase credentials not configured. Backend features will be unavailable.'
  )
}

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null
