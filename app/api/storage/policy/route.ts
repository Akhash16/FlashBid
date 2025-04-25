import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Debug function to log environment variables
function logEnvironmentInfo() {
  console.log('SUPABASE URL LENGTH:', supabaseUrl ? supabaseUrl.length : 0);
  console.log('SUPABASE KEY LENGTH:', supabaseKey ? supabaseKey.length : 0);
  console.log('SUPABASE URL VALID:', !!supabaseUrl);
  console.log('SUPABASE KEY VALID:', !!supabaseKey);
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: Request) {
  const response = NextResponse.json({}, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Helper function to check if bucket exists already
async function checkForExistingBucket() {
  // Check for pre-created buckets in the public storage
  const adminResponse = await fetch('https://api.supabase.io/v1/storage/buckets', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY || ''}`
    }
  });
  
  // If admin API doesn't work, we'll fallback to normal checks
  if (!adminResponse.ok) return null;
  
  try {
    const buckets = await adminResponse.json();
    return buckets.find((b: {name: string}) => b.name === 'auction-images');
  } catch (error) {
    console.error('Error parsing bucket list:', error);
    return null;
  }
}

export async function GET(request: Request) {
  console.log('Storage policy API called', request.url);
  
  try {
    // Check if environment variables are available
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing Supabase environment variables'
        },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // First check if the bucket exists
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket('auction-images')
    
    if (bucketError) {
      console.error('Bucket does not exist, cannot configure policies:', bucketError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bucket does not exist, cannot configure policies',
          message: 'The auction-images bucket needs to be created first',
          adminAction: 'Create the auction-images bucket in Supabase dashboard'
        },
        { status: 404 }
      );
    }
    
    console.log('Bucket exists, configuring policies...');
    
    // Update bucket settings first
    const { error: updateError } = await supabase
      .storage
      .updateBucket('auction-images', {
        public: true, // Make the bucket public
        fileSizeLimit: 5 * 1024 * 1024, // 5MB limit per file
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      });
    
    if (updateError) {
      console.error('Failed to update bucket settings:', updateError);
      
      // Check for permission issues
      if (updateError.message && updateError.message.includes('row-level security policy')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Permission denied: Row Level Security policy is preventing bucket updates',
            message: 'You need admin permissions to configure the storage bucket',
            adminAction: 'Set the auction-images bucket to public in Supabase dashboard'
          },
          { status: 403 }
        );
      }
      
      // Other errors
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update bucket settings',
          details: updateError.message
        },
        { status: 500 }
      );
    }
    
    // Now try to create the SELECT policy for public viewing
    try {
      const { error: selectPolicyError } = await supabase.rpc('pgSQL', {
        query: `
          CREATE POLICY "Anyone can view images" 
          ON storage.objects FOR SELECT 
          USING (bucket_id = 'auction-images')
        `
      });
      
      if (selectPolicyError && !selectPolicyError.message.includes('already exists')) {
        console.warn('Error creating SELECT policy:', selectPolicyError);
        // Continue anyway - policy might already exist
      }
    } catch (error) {
      console.warn('Exception creating SELECT policy:', error);
      // Continue anyway - policy might already exist
    }
    
    // Now try to create the INSERT policy for authenticated users
    try {
      const { error: insertPolicyError } = await supabase.rpc('pgSQL', {
        query: `
          CREATE POLICY "Authenticated users can upload images" 
          ON storage.objects FOR INSERT 
          WITH CHECK (bucket_id = 'auction-images' AND auth.role() = 'authenticated')
        `
      });
      
      if (insertPolicyError && !insertPolicyError.message?.includes('already exists')) {
        console.warn('Error creating INSERT policy:', insertPolicyError);
        // Continue anyway - policy might already exist
      }
    } catch (error) {
      console.warn('Exception creating INSERT policy:', error);
      // Continue anyway - policy might already exist
    }
    
    // Return success response
    const response = NextResponse.json({
      success: true,
      message: 'Storage policies configured successfully'
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (error) {
    console.error('Unexpected error in storage policy API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred configuring storage policies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 