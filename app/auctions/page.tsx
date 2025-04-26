"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Clock, Filter, Search, SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "@/components/ui/use-toast"

// Define auction type
interface Auction {
  id: string;
  title: string;
  description: string;
  currentBid?: number;
  startingPrice: number;
  endTime: Date;
  bidCount?: number;
  images?: string[];
  image?: string;
  category: string;
  condition: string;
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("ending-soon")
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categories = ["Electronics", "Collectibles", "Fashion", "Art", "Home"]

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handleConditionToggle = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition],
    )
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Apply filters with the search query
    applyFilters()
  }

  // Client-side only time formatting to prevent hydration mismatch
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({})

  // Format time left function
  const formatTimeLeft = (endTime: Date) => {
    const now = new Date()
    const diff = endTime.getTime() - now.getTime()

    if (diff <= 0) return "Ended"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  // Update time left for all auctions on client-side only
  useEffect(() => {
    const updateTimeLeft = () => {
      const newTimeLeft: Record<string, string> = {}
      auctions.forEach(auction => {
        newTimeLeft[auction.id] = formatTimeLeft(auction.endTime)
      })
      setTimeLeft(newTimeLeft)
    }
    
    // Initial update
    updateTimeLeft()
    
    // Set interval to update time left every minute
    const intervalId = setInterval(updateTimeLeft, 60000)
    
    return () => clearInterval(intervalId)
  }, [auctions])

  // Fetch auctions from the API
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        
        // Use the real Supabase API endpoint
        const response = await fetch('/api/auctions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch auctions');
        }
        
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        // Check if we got auctions back
        if (!data.auctions || !Array.isArray(data.auctions)) {
          throw new Error('Invalid response from server');
        }
        
        // Transform the data to match our Auction interface
        const transformedAuctions = data.auctions.map((auction: any) => ({
          ...auction,
          // Convert string dates to Date objects
          endTime: new Date(auction.end_time || auction.endTime),
          // Use starting_price as currentBid if no bids yet
          currentBid: auction.current_bid || auction.currentBid || auction.starting_price,
          // Handle image array vs single image
          image: auction.images && auction.images.length > 0 ? auction.images[0] : auction.image || '/placeholder.svg'
        }));
        
        // Sort the auctions initially based on current sortBy value
        const sortedAuctions = [...transformedAuctions];
        
        switch (sortBy) {
          case "ending-soon":
            sortedAuctions.sort((a, b) => a.endTime.getTime() - b.endTime.getTime())
            break
          case "newest":
            sortedAuctions.sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
            break
          case "price-low":
            sortedAuctions.sort((a, b) => (a.currentBid || a.startingPrice) - (b.currentBid || b.startingPrice))
            break
          case "price-high":
            sortedAuctions.sort((a, b) => (b.currentBid || b.startingPrice) - (a.currentBid || a.startingPrice))
            break
          case "bids":
            sortedAuctions.sort((a, b) => (b.bidCount || 0) - (a.bidCount || 0))
            break
        }
        
        setAuctions(sortedAuctions);
        setError(null);
      } catch (err) {
        console.error('Error fetching auctions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load auctions');
        toast({
          title: "Error",
          description: "Could not load auction data.",
          variant: "destructive",
        });
        // Show empty auctions list
        setAuctions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuctions();
  }, []);
  
  const applyFilters = () => {
    // Fetch filtered auctions from the API
    const fetchFilteredAuctions = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        
        if (searchQuery.trim()) {
          params.append('query', searchQuery);
        }
        
        if (selectedCategories.length > 0) {
          params.append('category', selectedCategories.join(','));
        }
        
        if (selectedConditions.length > 0) {
          params.append('condition', selectedConditions.join(','));
        }
        
        params.append('minPrice', priceRange[0].toString());
        params.append('maxPrice', priceRange[1].toString());
        
        // Use the real Supabase API endpoint
        const response = await fetch(`/api/auctions?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch filtered auctions');
        }
        
        const data = await response.json();
        
        // Check if we got auctions back
        if (!data.auctions || !Array.isArray(data.auctions)) {
          throw new Error('Invalid response from server');
        }
        
        // Transform the data to match our Auction interface
        const transformedAuctions = data.auctions.map((auction: any) => ({
          ...auction,
          // Convert string dates to Date objects
          endTime: new Date(auction.end_time || auction.endTime),
          // Use starting_price as currentBid if no bids yet
          currentBid: auction.current_bid || auction.currentBid || auction.starting_price,
          // Handle image array vs single image
          image: auction.images && auction.images.length > 0 ? auction.images[0] : auction.image || '/placeholder.svg'
        }));
        
        // Sort the auctions after applying filters based on current sortBy value
        const sortedAuctions = [...transformedAuctions];
        
        switch (sortBy) {
          case "ending-soon":
            sortedAuctions.sort((a, b) => a.endTime.getTime() - b.endTime.getTime())
            break
          case "newest":
            sortedAuctions.sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
            break
          case "price-low":
            sortedAuctions.sort((a, b) => (a.currentBid || a.startingPrice) - (b.currentBid || b.startingPrice))
            break
          case "price-high":
            sortedAuctions.sort((a, b) => (b.currentBid || b.startingPrice) - (a.currentBid || a.startingPrice))
            break
          case "bids":
            sortedAuctions.sort((a, b) => (b.bidCount || 0) - (a.bidCount || 0))
            break
        }
        
        setAuctions(sortedAuctions);
        setError(null);
      } catch (err) {
        console.error('Error fetching filtered auctions:', err);
        setError(err instanceof Error ? err.message : 'Failed to apply filters');
        toast({
          title: "Filter error",
          description: "Could not apply filters.",
          variant: "destructive",
        });
        // Keep current auctions
      } finally {
        setLoading(false);
      }
    };
    
    fetchFilteredAuctions();
  }

  // Update sorting when sortBy changes
  useEffect(() => {
    if (!auctions || auctions.length === 0) return;
    
    // Track if this is a sort update to avoid infinite loops
    const wasSortUpdate = sessionStorage.getItem('wasSortUpdate') === 'true';
    if (wasSortUpdate) {
      sessionStorage.removeItem('wasSortUpdate');
      return;
    }
    
    try {
      const sortedAuctions = [...auctions];
      
      switch (sortBy) {
        case "ending-soon":
          sortedAuctions.sort((a, b) => a.endTime.getTime() - b.endTime.getTime())
          break
        case "newest":
          sortedAuctions.sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
          break
        case "price-low":
          sortedAuctions.sort((a, b) => (a.currentBid || a.startingPrice) - (b.currentBid || b.startingPrice))
          break
        case "price-high":
          sortedAuctions.sort((a, b) => (b.currentBid || b.startingPrice) - (a.currentBid || a.startingPrice))
          break
        case "bids":
          sortedAuctions.sort((a, b) => (b.bidCount || 0) - (a.bidCount || 0))
          break
      }
      
      // Mark that this update was from sorting
      sessionStorage.setItem('wasSortUpdate', 'true');
      setAuctions(sortedAuctions);
    } catch (error) {
      console.error('Error sorting auctions:', error);
    }
  }, [sortBy, auctions]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Browse Auctions</h1>
          <p className="text-muted-foreground">Find unique items from sellers around the world</p>
        </div>

        <div className="w-full md:w-auto flex gap-2">
          <form onSubmit={handleSearch} className="flex-1 md:w-[300px] flex">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search auctions..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" className="ml-2">
              Search
            </Button>
          </form>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow down your search results</SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-6">
                {/* Mobile filters - same as desktop filters */}
                <div className="space-y-4">
                  <h3 className="font-medium">Price Range</h3>
                  <Slider
                    defaultValue={[0, 1000]}
                    max={1000}
                    step={10}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                  />
                  <div className="flex justify-between text-sm">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-mobile-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => handleCategoryToggle(category)}
                        />
                        <Label htmlFor={`category-mobile-${category}`}>{category}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Condition</h3>
                  <div className="space-y-2">
                    {["New", "Like New", "Excellent", "Good", "Fair"].map((condition) => (
                      <div key={condition} className="flex items-center space-x-2">
                        <Checkbox
                          id={`condition-mobile-${condition}`}
                          checked={selectedConditions.includes(condition)}
                          onCheckedChange={() => handleConditionToggle(condition)}
                        />
                        <Label htmlFor={`condition-mobile-${condition}`}>{condition}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  className="w-1/2"
                  onClick={() => {
                    setSelectedCategories([])
                    setSelectedConditions([])
                    setPriceRange([0, 1000])
                    setSearchQuery("")
                    window.location.reload()
                  }}
                >
                  Reset
                </Button>
                <Button
                  className="w-1/2"
                  onClick={() => {
                    applyFilters()
                    // Close the sheet after applying filters
                    document
                      .querySelector('[data-state="open"]')
                      ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Desktop Filters Sidebar */}
        <div className="hidden md:block space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Price Range</h3>
                <Slider
                  defaultValue={[0, 1000]}
                  max={1000}
                  step={10}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                />
                <div className="flex justify-between text-sm">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <Label htmlFor={`category-${category}`}>{category}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Condition</h3>
                <div className="space-y-2">
                  {["New", "Like New", "Excellent", "Good", "Fair"].map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={`condition-${condition}`}
                        checked={selectedConditions.includes(condition)}
                        onCheckedChange={() => handleConditionToggle(condition)}
                      />
                      <Label htmlFor={`condition-${condition}`}>{condition}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                className="w-1/2"
                onClick={() => {
                  setSelectedCategories([])
                  setSelectedConditions([])
                  setPriceRange([0, 1000])
                  setSearchQuery("")
                  window.location.reload()
                }}
              >
                Reset
              </Button>
              <Button className="w-1/2" onClick={applyFilters}>
                Apply Filters
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Auctions Grid */}
        <div className="md:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{auctions.length} results</p>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-by" className="text-sm whitespace-nowrap">
                Sort by:
              </Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by" className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ending-soon">Ending Soon</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="bids">Most Bids</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p>Loading auctions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : auctions.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p>No auctions found matching your criteria.</p>
              
              <div className="flex gap-3 justify-center mt-4">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reset Filters
                </Button>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      // Call the reset-db endpoint to refresh the database connection
                      const response = await fetch('/api/reset-db');
                      const data = await response.json();
                      toast({
                        title: "Database connection reset",
                        description: data.message,
                        variant: data.status === 'error' ? "destructive" : "default",
                      });
                      // Reload the page after resetting
                      setTimeout(() => window.location.reload(), 1000);
                    } catch (err) {
                      console.error('Debug error:', err);
                      toast({
                        title: "Error",
                        description: err instanceof Error ? err.message : String(err),
                        variant: "destructive",
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Reset Database Connection
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((auction) => (
                <Card key={auction.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={auction.image || "/placeholder.svg"}
                      alt={auction.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeLeft[auction.id] || ""}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg truncate">{auction.title}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{auction.category}</Badge>
                      <Badge variant="outline">{auction.condition}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Bid</p>
                        <p className="text-lg font-bold">${auction.currentBid || auction.startingPrice}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{auction.bidCount || 0} bids</p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button asChild className="w-full">
                      {auction.id ? (
                        <Link href={`/auctions/${auction.id}`}>View Auction</Link>
                      ) : (
                        <span>View Auction</span>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
