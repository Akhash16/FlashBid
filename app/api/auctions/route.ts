import { NextResponse } from "next/server"

// Mock database
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
  // Get query parameters
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")
  const category = searchParams.get("category")
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")

  // Filter auctions based on query parameters
  let filteredAuctions = [...auctions]

  if (query) {
    filteredAuctions = filteredAuctions.filter(
      (auction) =>
        auction.title.toLowerCase().includes(query.toLowerCase()) ||
        auction.description.toLowerCase().includes(query.toLowerCase()),
    )
  }

  if (category) {
    filteredAuctions = filteredAuctions.filter((auction) => auction.category === category)
  }

  if (minPrice) {
    filteredAuctions = filteredAuctions.filter((auction) => auction.currentBid >= Number(minPrice))
  }

  if (maxPrice) {
    filteredAuctions = filteredAuctions.filter((auction) => auction.currentBid <= Number(maxPrice))
  }

  return NextResponse.json({ auctions: filteredAuctions })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["title", "description", "startingPrice", "category", "condition"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Create new auction
    const newAuction = {
      id: `auction-${Date.now()}`,
      title: body.title,
      description: body.description,
      currentBid: body.startingPrice,
      startingPrice: body.startingPrice,
      bidCount: 0,
      endTime: new Date(body.endTime || Date.now() + 7 * 86400000), // Default 7 days
      seller: {
        id: "current-user", // In a real app, this would be the authenticated user
        name: "Current User",
        rating: 5.0,
      },
      category: body.category,
      condition: body.condition,
      createdAt: new Date(),
    }

    // In a real app, you would save to a database
    auctions.push(newAuction)

    return NextResponse.json({ auction: newAuction }, { status: 201 })
  } catch (error) {
    console.error("Error creating auction:", error)
    return NextResponse.json({ error: "Failed to create auction" }, { status: 500 })
  }
}
