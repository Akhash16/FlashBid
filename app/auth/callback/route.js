import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/auctions'

  if (code) {
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth/signin?error=Authentication failed', request.url))
    }

    // Check if this is a new user and create a profile if needed
    if (data && data.user) {
      // First check if a profile already exists for this user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError && profileError.code === 'PGRST116') {
        // No profile found (PGRST116 is the error code for "no rows returned")
        // Create a new profile for the user
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: data.user.email?.split('@')[0] || `user_${Date.now()}`,
            full_name: '',
            avatar_url: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (insertError) {
          console.error('Error creating user profile:', insertError)
        }
      } else if (profileError) {
        console.error('Error checking for existing profile:', profileError)
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, request.url))
} 