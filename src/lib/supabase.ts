import { createClient } from '@supabase/supabase-js'

// These public build-time variables are injected by B12 or the deployment host.
// Never place a project URL or key directly in this source file.
const rawSupabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_KEY?.trim()
const supabaseUrl = rawSupabaseUrl?.replace(/\/+$/, '')

function isValidSupabaseUrl(value: string | undefined): value is string {
  if (!value) return false

  try {
    const parsed = new URL(value)
    const isLocalDevelopmentHost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '[::1]'

    return (
      (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && isLocalDevelopmentHost)) &&
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
    'Supabase is not configured correctly. Set PUBLIC_SUPABASE_URL to a valid HTTP(S) project URL and PUBLIC_SUPABASE_KEY to its publishable key.'
  )
}

export const supabase = validSupabaseUrl && supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null
