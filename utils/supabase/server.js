import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle errors when running in a middleware or non-cookie environment
            console.warn('Warning: Could not set cookie', error)
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle errors when running in a middleware or non-cookie environment
            console.warn('Warning: Could not remove cookie', error)
          }
        },
      },
    }
  )
} 