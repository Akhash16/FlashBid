import { NextResponse } from "next/server"
import { createClient as createBrowserClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('Resetting database connection...')
    
    // Create a fresh Supabase client
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
    
    // Test connection with a simple query
    const { data, error } = await supabase
      .from('auctions')
      .select('count()')
      .single()
    
    if (error) {
      console.error('Database connection test failed:', error)
      return NextResponse.json({
        status: 'error',
        message: 'Database connection test failed',
        error: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection reset successfully',
      data
    })
  } catch (error) {
    console.error('Error resetting database connection:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Error resetting database connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 