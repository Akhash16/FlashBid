import { NextResponse } from "next/server"
import { createClient as createBrowserClient } from '@supabase/supabase-js'

// Create a Supabase client
const createSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

export async function GET(request: Request) {
  // Store URL and searchParams 
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  try {
    // Get query parameters
    const query = searchParams.get("query")
    const category = searchParams.get("category")
    const condition = searchParams.get("condition")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const id = searchParams.get("id")
    
    // Create Supabase client
    const supabase = createSupabaseClient();
    
    // Start building the query
    let supabaseQuery = supabase.from('auctions').select('*')
    
    // If ID is provided, return the specific auction
    if (id) {
      supabaseQuery = supabaseQuery.eq('id', id)
    }
    
    // Apply filters
    if (query) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }
    
    if (category) {
      // If category is comma-separated, handle multiple categories
      if (category.includes(',')) {
        const categories = category.split(',');
        // Create an OR clause for multiple categories with case-insensitive matching
        const categoryFilters = categories.map(cat => `category.ilike.%${cat}%`);
        const orClause = categoryFilters.join(',');
        supabaseQuery = supabaseQuery.or(orClause);
      } else {
        // Use ilike for case-insensitive comparison
        supabaseQuery = supabaseQuery.ilike('category', `%${category}%`);
      }
    }
    
    if (condition) {
      // If condition is comma-separated, handle multiple conditions
      if (condition.includes(',')) {
        const conditions = condition.split(',');
        // Create an OR clause for multiple conditions with case-insensitive matching
        const conditionFilters = conditions.map(cond => `condition.ilike.%${cond}%`);
        const orClause = conditionFilters.join(',');
        supabaseQuery = supabaseQuery.or(orClause);
      } else {
        // Use ilike for case-insensitive comparison
        supabaseQuery = supabaseQuery.ilike('condition', `%${condition}%`);
      }
    }
    
    if (minPrice) {
      supabaseQuery = supabaseQuery.gte('starting_price', parseFloat(minPrice))
    }
    
    if (maxPrice) {
      supabaseQuery = supabaseQuery.lte('starting_price', parseFloat(maxPrice))
    }
    
    // Log for debugging
    console.log('Applying filters:', { query, category, condition, minPrice, maxPrice, id });
  
    // Execute the query
    const { data, error } = await supabaseQuery;
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    // Transform data to match expected format
    const formattedAuctions = data.map(auction => ({
      id: auction.id,
      title: auction.title,
      description: auction.description,
      startingPrice: auction.starting_price,
      currentBid: auction.current_bid || auction.starting_price, // Use starting price if no bids yet
      bidCount: auction.bid_count || 0,
      endTime: auction.end_time,
      images: auction.images || [],
      category: auction.category,
      condition: auction.condition,
      status: auction.status,
      createdAt: auction.start_time || auction.created_at,
      shippingCost: auction.shipping_cost,
      shippingLocations: auction.shipping_locations,
      seller: {
        id: auction.user_id,
        name: "Seller", // This would be fetched from users table in a real implementation
        rating: 5.0,
      }
    }));
    
    return NextResponse.json({ 
      auctions: formattedAuctions, 
      source: 'supabase' 
    });
    
  } catch (error) {
    console.error('Server error:', error);
    
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to fetch auctions',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Format the data for the database (transform camelCase to snake_case)
    const auctionData = {
      title: body.title,
      description: body.description,
      starting_price: body.startingPrice || body.starting_price,
      reserve_price: body.reservePrice || body.reserve_price || null,
      category: body.category,
      condition: body.condition,
      end_time: body.endTime || body.end_time,
      images: body.images,
      shipping_cost: body.shippingCost || body.shipping_cost || 0,
      shipping_locations: body.shippingLocations || body.shipping_locations || 'domestic',
      user_id: user.id, // Override with authenticated user ID for security
      status: 'active',
      start_time: new Date().toISOString()
    }
    
    // Insert into database
    const { data, error } = await supabase
      .from('auctions')
      .insert(auctionData)
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create auction' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Auction created successfully',
      auction: data 
    }, { status: 201 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
  })
}
