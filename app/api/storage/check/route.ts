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

export async function GET(request: Request) {
  console.log('Storage check API called', request.url);
  
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
    
    // Check if the bucket exists
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket('auction-images')
    
    if (bucketError) {
      // Check the specific error
      if (bucketError.message && bucketError.message.includes('not found')) {
        console.log('Bucket not found');
        return NextResponse.json(
          {
            success: false,
            exists: false,
            message: 'Auction images bucket does not exist'
          },
          { status: 404 }
        );
      }
      
      // Permission errors
      if (bucketError.message && bucketError.message.includes('row-level security policy')) {
        console.error('Permission error checking bucket:', bucketError);
        return NextResponse.json(
          {
            success: false,
            error: 'Permission denied: Row Level Security policy is preventing bucket access',
            message: 'You need admin permissions to check the storage bucket',
            adminAction: 'Check permissions for the auction-images bucket in Supabase dashboard'
          },
          { status: 403 }
        );
      }
      
      // Other errors
      console.error('Error checking bucket:', bucketError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check if bucket exists',
          details: bucketError.message
        },
        { status: 500 }
      );
    }
    
    // Bucket exists
    console.log('Bucket found:', bucketData?.name);
    const response = NextResponse.json({
      success: true,
      exists: true,
      message: 'Auction images bucket exists',
      bucketName: bucketData?.name
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (error) {
    console.error('Unexpected error in storage check API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred checking storage bucket',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 