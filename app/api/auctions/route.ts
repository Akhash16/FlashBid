import { NextResponse } from "next/server"
import { createClient } from '@/utils/supabase/server'

// Mock database - Kept for fallback only, but will prefer Supabase data
const auctions = [
  {
    id: "1",
    title: "Vintage Watch Collection",
    description: "A collection of rare vintage watches from the 1950s.",
    currentBid: 1250,
    startingPrice: 1000,
    bidCount: 8,
    endTime: new Date(Date.now() + 10000000),
    seller: {
      id: "seller1",
      name: "John Collector",
      rating: 4.8,
    },
    category: "Collectibles",
    condition: "Excellent",
    createdAt: new Date(Date.now() - 86400000),
  },
  // More auctions would be here
]

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")
    const category = searchParams.get("category")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const id = searchParams.get("id")
    
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
      supabaseQuery = supabaseQuery.eq('category', category)
    }
    
    if (minPrice) {
      supabaseQuery = supabaseQuery.gte('starting_price', parseFloat(minPrice))
    }
    
    if (maxPrice) {
      supabaseQuery = supabaseQuery.lte('starting_price', parseFloat(maxPrice))
    }
    
    // Execute the query
    const { data, error } = await supabaseQuery
    
    if (error) {
      console.error('Supabase query error:', error)
      // Fallback to mock data if Supabase query fails
      if (id) {
        return NextResponse.json({ 
          auctions: auctions.filter(auction => auction.id === id || auction.id.toString() === id),
          source: 'mock'
        })
      }
      return NextResponse.json({ auctions: auctions, source: 'mock' })
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
    }))
    
    return NextResponse.json({ auctions: formattedAuctions, source: 'supabase' })
  } catch (error) {
    console.error('Server error:', error)
    // Fallback to mock data in case of error
    if (searchParams.get("id")) {
      return NextResponse.json({ 
        auctions: auctions.filter(auction => auction.id === searchParams.get("id")),
        source: 'mock'
      })
    }
    return NextResponse.json({ auctions: auctions, source: 'mock' })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
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
