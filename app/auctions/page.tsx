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

// Mock auctions data
const mockAuctions = Array.from({ length: 12 }).map((_, i) => ({
  id: `auction-${i + 1}`,
  title: `Auction Item ${i + 1}`,
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  currentBid: Math.floor(Math.random() * 1000) + 50,
  endTime: new Date(Date.now() + Math.random() * 10000000),
  bidCount: Math.floor(Math.random() * 20),
  image: `/placeholder.svg?height=200&width=300&text=Item ${i + 1}`,
  category: ["Electronics", "Collectibles", "Fashion", "Art", "Home"][Math.floor(Math.random() * 5)],
  condition: ["New", "Like New", "Excellent", "Good", "Fair"][Math.floor(Math.random() * 5)],
}))

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState(mockAuctions)
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("ending-soon")
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])

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
    // In a real app, you would fetch filtered results from the server
    console.log("Searching for:", searchQuery)
  }

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

  const applyFilters = () => {
    // Start with all auctions
    let filtered = mockAuctions

    // Apply price range filter
    filtered = filtered.filter((auction) => auction.currentBid >= priceRange[0] && auction.currentBid <= priceRange[1])

    // Apply category filter if any categories are selected
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((auction) => selectedCategories.includes(auction.category))
    }

    // Apply condition filter if any conditions are selected
    if (selectedConditions.length > 0) {
      filtered = filtered.filter((auction) => selectedConditions.includes(auction.condition))
    }

    // Apply search query if present
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (auction) =>
          auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          auction.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Update the auctions state
    setAuctions(filtered)
  }

  useEffect(() => {
    const sortedAuctions = [...auctions]

    switch (sortBy) {
      case "ending-soon":
        sortedAuctions.sort((a, b) => a.endTime.getTime() - b.endTime.getTime())
        break
      case "newest":
        sortedAuctions.sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
        break
      case "price-low":
        sortedAuctions.sort((a, b) => a.currentBid - b.currentBid)
        break
      case "price-high":
        sortedAuctions.sort((a, b) => b.currentBid - a.currentBid)
        break
      case "bids":
        sortedAuctions.sort((a, b) => b.bidCount - a.bidCount)
        break
    }

    setAuctions(sortedAuctions)
  }, [sortBy])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Browse Auctions</h1>
          <p className="text-muted-foreground">Find unique items from sellers around the world</p>
        </div>

        <div className="w-full md:w-auto flex gap-2">
          <form onSubmit={handleSearch} className="flex-1 md:w-[300px]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search auctions..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                    setAuctions(mockAuctions)
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
                  setAuctions(mockAuctions)
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
                      {formatTimeLeft(auction.endTime)}
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
                      <p className="text-lg font-bold">${auction.currentBid}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{auction.bidCount} bids</p>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button asChild className="w-full">
                    <Link href={`/auctions/${auction.id}`}>View Auction</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
