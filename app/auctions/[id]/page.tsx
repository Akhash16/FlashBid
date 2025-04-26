"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { useParams } from "next/navigation"
import { Clock, DollarSign, Eye, Heart, Share2, ShieldCheck } from "lucide-react"
import Image from "next/image"

// Define auction type
interface Bid {
  id: string;
  user: string;
  amount: number;
  time: string;
}

interface Seller {
  id: string;
  name: string;
  rating: number;
  totalSales?: number;
}

interface Auction {
  id: string;
  title: string;
  description: string;
  seller: Seller;
  startingPrice: number;
  currentBid: number;
  bidCount: number;
  endTime: Date;
  images: string[];
  watchers: number;
  category: string;
  condition: string;
  bids: Bid[];
  createdAt?: Date;
  shippingCost?: number;
  shippingLocations?: string;
}

export default function AuctionPage() {
  const { id } = useParams()
  const { toast } = useToast()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [loading, setLoading] = useState(true)
  const [bidAmount, setBidAmount] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [mainImage, setMainImage] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Fetch auction data
  useEffect(() => {
    const fetchAuction = async () => {
      try {
        setLoading(true);
        
        // Fetch from Supabase API endpoint
        const response = await fetch(`/api/auctions?id=${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch auction');
        }
        
        const data = await response.json();
        console.log("Supabase API response:", data);
        
        // Check if we have any auctions
        if (!data.auctions || data.auctions.length === 0) {
          setError("Auction not found");
          return;
        }
        
        // Find the specific auction in the returned array
        const fetchedAuction = data.auctions.find((a: any) => a.id === id || a.id.toString() === id);
        
        if (fetchedAuction) {
          // Format the data properly
          const formattedAuction: Auction = {
            ...fetchedAuction,
            // Convert snake_case properties to camelCase if needed
            startingPrice: fetchedAuction.startingPrice || fetchedAuction.starting_price,
            currentBid: fetchedAuction.currentBid || fetchedAuction.current_bid || fetchedAuction.startingPrice,
            bidCount: fetchedAuction.bidCount || fetchedAuction.bid_count || 0,
            // Ensure endTime is a Date object
            endTime: new Date(fetchedAuction.endTime || fetchedAuction.end_time),
            // Use images array from Supabase or default placeholder
            images: fetchedAuction.images && fetchedAuction.images.length > 0 
              ? fetchedAuction.images 
              : [`https://picsum.photos/seed/${id}/600/400`],
            watchers: fetchedAuction.watchers || Math.floor(Math.random() * 30) + 5,
            // Use existing bids or empty array
            bids: fetchedAuction.bids || [],
            seller: fetchedAuction.seller || {
              id: fetchedAuction.user_id || "current-user",
              name: fetchedAuction.seller_name || "Seller",
              rating: 5.0,
              totalSales: 1
            },
            shippingCost: fetchedAuction.shippingCost || fetchedAuction.shipping_cost,
            shippingLocations: fetchedAuction.shippingLocations || fetchedAuction.shipping_locations
          };
          
          setAuction(formattedAuction);
          
          // Set main image to the first image in the array
          if (formattedAuction.images && formattedAuction.images.length > 0) {
            setMainImage(formattedAuction.images[0]);
          }
          
          // Set initial bid amount to current bid + 50 (or starting price + 50 if no bids)
          const currentBid = formattedAuction.currentBid || formattedAuction.startingPrice;
          setBidAmount(currentBid + 50);
          
          console.log("Auction loaded successfully:", formattedAuction);
        } else {
          setError("Auction not found");
        }
      } catch (error) {
        console.error("Error fetching auction:", error);
        setError(error instanceof Error ? error.message : "Could not load auction data");
        toast({
          title: "Error",
          description: "Could not load auction data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAuction();
    }
  }, [id, toast]);

  // Calculate time left
  useEffect(() => {
    if (!auction) return;
    
    const interval = setInterval(() => {
      const now = new Date()
      const diff = auction.endTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("Auction ended")
        clearInterval(interval)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
    }, 1000)

    return () => clearInterval(interval)
  }, [auction?.endTime])

  // Connect to WebSocket
  useEffect(() => {
    // In a real app, you would connect to your WebSocket server
    // const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL)

    // Simulate connection
    const timeout = setTimeout(() => {
      setIsConnected(true)
      toast({
        title: "Connected to auction",
        description: "You'll receive real-time updates for this auction.",
      })
    }, 1000)

    // Simulate receiving a new bid
    const bidInterval = setInterval(() => {
      if (Math.random() > 0.7 && auction) {
        const newBid = auction.currentBid + Math.floor(Math.random() * 50) + 10
        setAuction((prev) => {
          if (!prev) return null;
          
          return {
            ...prev,
            currentBid: newBid,
            bidCount: prev.bidCount + 1,
            bids: [
              {
                id: `bid${Date.now()}`,
                user: ["Alex", "Taylor", "Jordan", "Morgan"][Math.floor(Math.random() * 4)],
                amount: newBid,
                time: "just now",
              },
              ...prev.bids.slice(0, 4),
            ],
          };
        });

        toast({
          title: "New bid received!",
          description: `Someone just bid $${newBid.toLocaleString()}`,
        })
      }
    }, 15000)

    return () => {
      clearTimeout(timeout)
      clearInterval(bidInterval)
      // socket.disconnect()
    }
  }, [auction, toast])

  const handleBid = () => {
    if (!auction) return;
    
    if (bidAmount <= auction.currentBid) {
      toast({
        title: "Bid too low",
        description: `Your bid must be higher than the current bid of $${auction.currentBid.toLocaleString()}`,
        variant: "destructive",
      })
      return
    }

    // In a real app, you would send this to your server
    setAuction((prev) => {
      if (!prev) return null;
      
      return {
        ...prev,
        currentBid: bidAmount,
        bidCount: prev.bidCount + 1,
        bids: [
          { id: `bid${Date.now()}`, user: "You", amount: bidAmount, time: "just now" }, 
          ...prev.bids.slice(0, 4)
        ],
      } as Auction;
    });

    toast({
      title: "Bid placed!",
      description: `You are now the highest bidder at $${bidAmount.toLocaleString()}`,
    })

    // Increase bid amount for next bid
    setBidAmount(bidAmount + 50)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-[50vh]">
        <div className="text-center">
          <Clock className="h-10 w-10 mx-auto mb-2 animate-pulse" />
          <p>Loading auction details...</p>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-[50vh]">
        <div className="text-center">
          <div className="mb-4 text-destructive">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="mx-auto">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Auction Not Found</h2>
          <p className="text-muted-foreground mb-4">{error || "We couldn't find the auction you're looking for."}</p>
          <Button asChild>
            <a href="/auctions">Browse Other Auctions</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">{auction.title}</h1>
              <div className="flex items-center mt-2 text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" /> {timeLeft}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">
                <Heart className="h-4 w-4 mr-2" />
                Watch
              </Button>
              <Button size="sm" variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image Gallery */}
            <div className="lg:col-span-2">
              <div className="flex flex-col space-y-4">
                <div className="relative bg-muted rounded-lg overflow-hidden h-[400px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : mainImage ? (
                    <div className="relative h-full w-full">
                      {/* Use Next.js Image component for Supabase images */}
                      <Image 
                        src={mainImage} 
                        alt={auction.title}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No image available</p>
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Gallery */}
                {auction.images && auction.images.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {auction.images.map((image, index) => (
                      <div 
                        key={index} 
                        className={`relative h-20 rounded-md overflow-hidden cursor-pointer border-2 ${mainImage === image ? 'border-primary' : 'border-transparent'}`}
                        onClick={() => setMainImage(image)}
                      >
                        <Image 
                          src={image} 
                          alt={`Thumbnail ${index + 1}`} 
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 20vw, 10vw"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right column - Auction details */}
            <div>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{auction.title}</CardTitle>
                      <CardDescription>
                        {auction.category} • {auction.condition}
                      </CardDescription>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{auction.category}</Badge>
                        <Badge variant="outline">{auction.condition}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://picsum.photos/seed/${auction.seller.id}/100/100`} />
                        <AvatarFallback>{auction.seller.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{auction.seller.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ⭐ {auction.seller.rating} • {auction.seller.totalSales || 0} sales
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium">Current Bid</span>
                      </div>
                      <span className="text-xl font-bold">${auction.currentBid.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <span className="text-sm font-medium">Time Left</span>
                      </div>
                      <span className="text-lg font-semibold">{timeLeft}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{auction.bidCount} bids</span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{auction.watchers} watching</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex gap-2 mb-2">
                        <Input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(Number(e.target.value))}
                          min={auction.currentBid + 1}
                          className="text-right"
                        />
                        <Button onClick={handleBid} className="whitespace-nowrap">
                          Place Bid
                        </Button>
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        Enter ${(auction.currentBid + 1).toLocaleString()} or more
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span>Secure payment via Stripe. Buyer protection included.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Recent Bids</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {auction.bids && auction.bids.length > 0 ? (
                        auction.bids.map((bid) => (
                          <li key={bid.id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>{bid.user.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{bid.user}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-medium">${bid.amount.toLocaleString()}</span>
                              <span className="text-xs text-muted-foreground">{bid.time}</span>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-center text-sm text-muted-foreground">No bids yet</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                <TabsTrigger value="seller">Seller Info</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="p-4">
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p>{auction.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="font-medium">Condition</h4>
                    <p>{auction.condition}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Category</h4>
                    <p>{auction.category}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="shipping" className="p-4">
                <h3 className="text-lg font-medium mb-2">Shipping Information</h3>
                <p>
                  {auction.shippingCost && auction.shippingCost > 0 
                    ? `Shipping cost: $${auction.shippingCost.toLocaleString()}` 
                    : 'Free shipping'}
                </p>
                <p className="mt-2">
                  Ships to: {auction.shippingLocations || 'Domestic only'}
                </p>
                <p className="mt-2">Estimated delivery: 3-5 business days after payment.</p>
              </TabsContent>
              <TabsContent value="seller" className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://picsum.photos/seed/${auction.seller.id}/100/100`} />
                    <AvatarFallback>{auction.seller.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">{auction.seller.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Member since {new Date(auction.createdAt || Date.now() - 10000000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold">⭐</p>
                    <p className="text-sm font-medium">{auction.seller.rating}/5</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold">{auction.seller.totalSales || 1}</p>
                    <p className="text-sm font-medium">Sales</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold">100%</p>
                    <p className="text-sm font-medium">Positive</p>
                    <p className="text-xs text-muted-foreground">Feedback</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  View All Items by This Seller
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  )
}
