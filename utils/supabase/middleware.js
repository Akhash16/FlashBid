import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          const cookie = request.cookies.get(name);
          return cookie?.value;
        },
        set(name, value, options) {
          // Set cookie on request
          request.cookies.set({
            name,
            value,
            ...options,
          })
          
          // Create a new response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          // Set cookie on response
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          // Remove cookie from request
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          
          // Create a new response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          // Remove cookie from response
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Refresh session if available
    await supabase.auth.getUser()
  } catch (e) {
    console.error('Error in middleware session refresh:', e)
  }

  return response
} 