import { createServerClient } from '@supabase/ssr'

export async function createPagesClient(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies[name]
        },
        set(name, value, options) {
          res.setHeader('Set-Cookie', `${name}=${value}; Path=/; ${options ? Object.entries(options).map(([key, value]) => `${key}=${value}`).join('; ') : ''}`)
        },
        remove(name, options) {
          res.setHeader('Set-Cookie', `${name}=; Max-Age=0; Path=/; ${options ? Object.entries(options).map(([key, value]) => `${key}=${value}`).join('; ') : ''}`)
        },
      },
    }
  )
} 