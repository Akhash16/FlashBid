import { NextResponse } from "next/server"

// Mock database
const bids = [
  {
    id: "bid1",
    auctionId: "1",
    userId: "user1",
    userName: "Alice",
    amount: 1250,
    createdAt: new Date(Date.now() - 120000),
  },
  {
    id: "bid2",
    auctionId: "1",
    userId: "user2",
    userName: "Bob",
    amount: 1200,
    createdAt: new Date(Date.now() - 900000),
  },
  // More bids would be here
]

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auctionId = params.id

  // Get bids for the specified auction
  const auctionBids = bids.filter((bid) => bid.auctionId === auctionId)

  // Sort by amount descending
  auctionBids.sort((a, b) => b.amount - a.amount)

  return NextResponse.json({ bids: auctionBids })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const auctionId = params.id
    const body = await request.json()

    // Validate required fields
    if (!body.amount) {
      return NextResponse.json({ error: "Bid amount is required" }, { status: 400 })
    }

    // Get current highest bid
    const auctionBids = bids.filter((bid) => bid.auctionId === auctionId)
    const highestBid = auctionBids.length > 0 ? Math.max(...auctionBids.map((bid) => bid.amount)) : 0

    // Check if bid is higher than current highest bid
    if (body.amount <= highestBid) {
      return NextResponse.json({ error: "Bid must be higher than current highest bid" }, { status: 400 })
    }

    // Create new bid
    const newBid = {
      id: `bid-${Date.now()}`,
      auctionId,
      userId: "current-user", // In a real app, this would be the authenticated user
      userName: "You",
      amount: body.amount,
      createdAt: new Date(),
    }

    // In a real app, you would save to a database
    bids.push(newBid)

    // In a real app, you would emit a WebSocket event here

    return NextResponse.json({ bid: newBid }, { status: 201 })
  } catch (error) {
    console.error("Error creating bid:", error)
    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 })
  }
}
