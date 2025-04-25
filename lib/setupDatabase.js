import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

/**
 * This script sets up the Supabase database
 * Run it with: node -r dotenv/config lib/setupDatabase.js
 */

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY // This requires the service key, not the anon key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

async function setupDatabase() {
  // Create Supabase client with service key for admin privileges
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('Connected to Supabase')

  try {
    // Read the schema SQL file
    const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')

    // Execute the SQL
    console.log('Applying database schema...')
    
    // Break SQL into individual statements to handle separately
    const statements = schemaSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0)
    
    // Execute each statement
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('pgSQL', { query: statement + ';' })
        if (error) {
          console.warn(`Warning executing statement: ${error.message}`)
          console.log(`Statement: ${statement.substring(0, 100)}...`)
        }
      } catch (err) {
        console.warn(`Exception executing statement: ${err.message}`)
      }
    }

    // Create storage bucket if it doesn't exist
    console.log('Setting up storage bucket...')
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .createBucket('auction-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      })

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.warn(`Warning creating bucket: ${bucketError.message}`)
    } else {
      console.log('Storage bucket setup complete')
    }

    // Create demo user if it doesn't exist
    console.log('Setting up demo user...')
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail('demo@example.com')
    
    if (userError) {
      console.warn(`Error checking for demo user: ${userError.message}`)
    } else if (!userData?.user) {
      // Create demo user if it doesn't exist
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'demo@example.com',
        password: 'demo123456',
        email_confirm: true
      })
      
      if (error) {
        console.warn(`Error creating demo user: ${error.message}`)
      } else {
        console.log('Demo user created successfully')
        
        // Create profile for demo user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: 'demouser',
            full_name: 'Demo User'
          })
          
        if (profileError) {
          console.warn(`Error creating demo profile: ${profileError.message}`)
        }
      }
    } else {
      console.log('Demo user already exists')
    }

    console.log('Database setup complete')
  } catch (error) {
    console.error('Error setting up database:', error.message)
    process.exit(1)
  }
}

setupDatabase()
  .then(() => {
    console.log('Setup completed successfully')
    process.exit(0)
  })
  .catch(err => {
    console.error('Setup failed:', err)
    process.exit(1)
  }) 