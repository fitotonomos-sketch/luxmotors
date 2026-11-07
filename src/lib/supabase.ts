
import { createClient } from '@supabase/supabase-js'

// Read public build-time variables from Render or B12.
const rawSupabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim()

// Support existing Render, B12, and Supabase variable names.
const supabaseKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.PUBLIC_SUPABASE_KEY?.trim() ||
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()

const supabaseUrl = rawSupabaseUrl?.replace(/\/+$/, '')

function isValidSupabaseUrl(
  value: string | undefined
): value is string {
  if (!value) return false

  try {
    const parsed = new URL(value)

    const isLocalDevelopmentHost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '[::1]'

    return (
      (parsed.protocol === 'https:' ||
        (parsed.protocol === 'http:' && isLocalDevelopmentHost)) &&
      parsed.pathname === '/' &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash
    )
  } catch {
    return false
  }
}

const validSupabaseUrl = isValidSupabaseUrl(supabaseUrl)

if (!validSupabaseUrl || !supabaseKey) {
  console.error(
    'Supabase configuration error. Check PUBLIC_SUPABASE_URL and your public Supabase key in Render Environment.'
  )
}

export const supabase =
  validSupabaseUrl && supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null
