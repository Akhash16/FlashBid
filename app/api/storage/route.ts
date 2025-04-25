import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase with environment variables instead of cookies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Debug function to log environment variables
function logEnvironmentInfo() {
  console.log('SUPABASE URL LENGTH:', supabaseUrl ? supabaseUrl.length : 0);
  console.log('SUPABASE KEY LENGTH:', supabaseKey ? supabaseKey.length : 0);
  console.log('SUPABASE URL VALID:', !!supabaseUrl);
  console.log('SUPABASE KEY VALID:', !!supabaseKey);
  console.log('SUPABASE SERVICE KEY VALID:', !!supabaseServiceKey);
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: Request) {
  const response = NextResponse.json({}, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Helper function to set up bucket policies
async function setupBucketPolicies(supabaseAdmin: any) {
  try {
    // Create policy for anyone to select/read (view) the objects using admin client
    await supabaseAdmin.rpc('pgSQL', {
      query: `
        CREATE POLICY "Anyone can view images"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'auction-images')
      `
    });
    
    // Create policy for authenticated users to insert (upload) objects
    await supabaseAdmin.rpc('pgSQL', {
      query: `
        CREATE POLICY "Authenticated users can upload images"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'auction-images' AND auth.role() = 'authenticated')
      `
    });
    
    console.log('Storage policies created successfully');
  } catch (policyError) {
    console.error('Error setting policies (continuing anyway):', policyError);
    // Don't fail if policy creation fails - the bucket might already have appropriate policies
  }
}

export async function GET(request: Request) {
  // Log route access
  console.log('Storage API called', request.url);
  
  try {
    // Log environment info for debugging
    logEnvironmentInfo();
    
    // Check if environment variables are available
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing Supabase environment variables',
          url_length: supabaseUrl ? supabaseUrl.length : 0,
          key_length: supabaseKey ? supabaseKey.length : 0
        },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Try to get bucket info to check if it exists
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket('auction-images')
    
    // If bucket exists, return success
    if (!bucketError) {
      console.log('Bucket already exists:', bucketData?.name);
      const response = NextResponse.json({ 
        success: true, 
        message: 'Auction images bucket already exists',
        bucketName: bucketData?.name
      });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }
    
    // If we get here, there was an error but we don't know if it's because the bucket doesn't exist
    // Let's check if the bucket exists using the admin client first
    console.log('Checking bucket existence with service role key');
      
    // Check if we have the service role key
    if (!supabaseServiceKey) {
      console.error('Missing Supabase service role key - cannot access bucket');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing Supabase service role key',
          adminAction: 'Add SUPABASE_SERVICE_ROLE_KEY to your environment variables',
          message: 'The storage system requires administrator setup with the service role key.'
        },
        { status: 500 }
      );
    }
    
    // Create an admin client with the service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // First check if the bucket already exists using the admin client
    const { data: adminBucketData, error: adminBucketError } = await supabaseAdmin
      .storage
      .getBucket('auction-images');
      
    // If the bucket exists according to the admin client, we just need to update permissions
    if (!adminBucketError) {
      console.log('Bucket exists according to admin client:', adminBucketData?.name);
      
      // Update bucket settings
      const { error: updateError } = await supabaseAdmin
        .storage
        .updateBucket('auction-images', {
          public: true, // Make the bucket public
          fileSizeLimit: 5 * 1024 * 1024, // 5MB limit per file
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });
      
      if (updateError) {
        console.error('Failed to update bucket settings:', updateError);
      } else {
        console.log('Bucket settings updated successfully');
      }
      
      // Set up policies and return success
      await setupBucketPolicies(supabaseAdmin);
      
      const response = NextResponse.json({
        success: true,
        message: 'Storage bucket exists and has been configured',
        bucketName: adminBucketData?.name
      });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }
    
    // If we get here, the bucket doesn't exist according to the admin client either
    // Let's create it
    console.log('Attempting to create bucket with service role key');
    
    // Attempt to create the bucket with retries
    let retries = 3;
    let createError = null;
    
    while (retries > 0) {
      try {
        console.log('Creating bucket with admin privileges');
        const { data, error } = await supabaseAdmin
          .storage
          .createBucket('auction-images', {
            public: true, // Make images publicly accessible
            fileSizeLimit: 1024 * 1024 * 5, // 5MB limit per file
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
          });
        
        if (error) {
          console.error(`Bucket creation failed (${retries} retries left):`, error);
          
          // Handle RLS error specifically
          if (error.message && error.message.includes('row-level security policy')) {
            return NextResponse.json(
              { 
                success: false, 
                error: 'Permission denied: Row Level Security policy is preventing bucket creation',
                details: 'You need to configure Supabase to allow bucket creation with the anonymous key, or create the bucket manually in the Supabase dashboard',
                message: 'Missing required permissions to create storage bucket',
                adminAction: 'Create the auction-images bucket manually in the Supabase dashboard'
              },
              { status: 403 }
            );
          }
          
          createError = error;
          retries--;
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // Successfully created bucket, now try to set up policies
        console.log('Bucket created successfully, setting up policies');
        
        // Set up policies
        await setupBucketPolicies(supabaseAdmin);
        
        
        // Verify bucket was created by trying to get it
        console.log('Verifying bucket exists');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a moment
        
        const { data: verifyData, error: verifyError } = await supabase
          .storage
          .getBucket('auction-images');
        
        if (verifyError) {
          console.error('Bucket verification failed:', verifyError);
          return NextResponse.json(
            { 
              success: false, 
              error: 'Failed to verify bucket creation',
              details: verifyError.message
            },
            { status: 500 }
          );
        }
        
        console.log('Bucket verified:', verifyData?.name);
        const response = NextResponse.json({
          success: true,
          message: 'Storage bucket created successfully',
          bucketName: verifyData?.name
        });
        
        // Add CORS headers
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      } catch (error) {
        console.error(`Bucket creation exception (${retries} retries left):`, error);
        retries--;
        
        // Wait before retry
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // If we get here, all creation attempts failed
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create storage bucket after multiple attempts',
        details: createError?.message || 'Unknown error'
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('Unexpected error in storage API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 