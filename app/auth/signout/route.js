import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    
    return NextResponse.redirect(new URL('/', req.url), {
      status: 302,
    })
  } catch (error) {
    console.error('Error during signout:', error)
    // Return 200 even on error, so the client can try client-side signout
    return new NextResponse(null, { status: 200 })
  }
}

export async function GET(req) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    
    return NextResponse.redirect(new URL('/', req.url), {
      status: 302,
    })
  } catch (error) {
    console.error('Error during signout:', error)
    // Return 200 even on error, so the client can try client-side signout
    return new NextResponse(null, { status: 200 })
  }
} 