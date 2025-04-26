// Simple script to test Supabase connection
import { createClient } from '@supabase/supabase-js'

// Initialize the Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Fetch data from the auctions table
    const { data, error } = await supabase
      .from('auctions')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('Error fetching data:', error)
      return
    }
    
    console.log('Successfully retrieved data!')
    console.log(`Retrieved ${data.length} auctions:`)
    console.log(data)
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the test
testSupabaseConnection() 