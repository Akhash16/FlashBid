"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, ImagePlus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { createClient } from '@/utils/supabase/client'

export default function CreateAuctionPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [endDate, setEndDate] = useState<Date>()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  // Form data states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [condition, setCondition] = useState("")
  const [startingPrice, setStartingPrice] = useState("")
  const [reservePrice, setReservePrice] = useState("")
  const [hourValue, setHourValue] = useState("")
  const [minuteValue, setMinuteValue] = useState("")
  const [duration, setDuration] = useState("")
  const [shippingCost, setShippingCost] = useState("")
  const [shippingLocations, setShippingLocations] = useState("")

  // Check if user is authenticated on client-side
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/signin')
          return
        }
        setUserId(user.id)
      } catch (error) {
        console.error("Auth error:", error)
        router.push('/auth/signin')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router, supabase.auth])
  
  // If still loading or no userId, show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-center text-muted-foreground">Checking authentication...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleImageUpload = () => {
    // In a real app, you would handle file uploads
    // For demo purposes, we'll just add placeholder images
    setImages([...images, `/placeholder.svg?height=400&width=600&text=Image ${images.length + 1}`])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Calculate end time based on duration or endDate+hour+minute
      let endTime = new Date();
      if (endDate && hourValue && minuteValue) {
        endTime = new Date(endDate);
        endTime.setHours(parseInt(hourValue), parseInt(minuteValue));
      } else if (duration) {
        // Add duration days to current date
        endTime = new Date();
        endTime.setDate(endTime.getDate() + parseInt(duration));
      } else {
        // Default to 7 days
        endTime.setDate(endTime.getDate() + 7);
      }

      const auctionData = {
        title,
        description,
        startingPrice: parseFloat(startingPrice),
        reservePrice: reservePrice ? parseFloat(reservePrice) : undefined,
        category,
        condition,
        endTime: endTime.toISOString(),
        images,
        shippingCost: shippingCost ? parseFloat(shippingCost) : 0,
        shippingLocations: shippingLocations || "domestic",
        userId
      };

      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auctionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create auction');
      }

      const data = await response.json();
      
      toast({
        title: "Auction created!",
        description: "Your auction has been created and is now live.",
      });
      
      // Redirect to the auction page or auctions list
      router.push(`/auctions/${data.auction.id}`);
    } catch (error) {
      console.error("Error creating auction:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create auction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create a New Auction</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Provide the basic details about your item.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Vintage Watch Collection" 
                    required 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your item in detail. Include condition, history, and any other relevant information."
                    className="min-h-[120px]"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select required value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="collectibles">Collectibles</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="fashion">Fashion</SelectItem>
                        <SelectItem value="home">Home & Garden</SelectItem>
                        <SelectItem value="art">Art</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select required value={condition} onValueChange={setCondition}>
                      <SelectTrigger id="condition">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="like-new">Like New</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>Set your starting and reserve prices.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startingPrice">Starting Price ($)</Label>
                    <Input 
                      id="startingPrice" 
                      type="number" 
                      placeholder="0.00" 
                      required 
                      min="0.01" 
                      step="0.01"
                      value={startingPrice}
                      onChange={(e) => setStartingPrice(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reservePrice">Reserve Price ($) (Optional)</Label>
                    <Input 
                      id="reservePrice" 
                      type="number" 
                      placeholder="0.00" 
                      min="0.01" 
                      step="0.01"
                      value={reservePrice}
                      onChange={(e) => setReservePrice(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Minimum price for the item to sell. Hidden from bidders.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Duration</CardTitle>
                <CardDescription>Choose when your auction will end.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="hourValue">Hour</Label>
                      <Select value={hourValue} onValueChange={setHourValue}>
                        <SelectTrigger id="hourValue">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i.toString().padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="minuteValue">Minute</Label>
                      <Select value={minuteValue} onValueChange={setMinuteValue}>
                        <SelectTrigger id="minuteValue">
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 15, 30, 45].map((min) => (
                            <SelectItem key={min} value={min.toString()}>
                              {min.toString().padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Or set duration in days</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="10">10 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>Upload images of your item.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div 
                        key={index} 
                        className="aspect-square bg-muted rounded-md overflow-hidden relative flex items-center justify-center"
                      >
                        {/* In a real app, you would render the image here */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          Image {index + 1}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="aspect-square bg-muted rounded-md flex flex-col items-center justify-center gap-1 border-2 border-dashed"
                      onClick={handleImageUpload}
                    >
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Add Image</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping</CardTitle>
                <CardDescription>Set shipping details for your item.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="shippingCost">Shipping Cost ($)</Label>
                  <Input 
                    id="shippingCost" 
                    type="number" 
                    placeholder="0.00" 
                    min="0" 
                    step="0.01"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Enter 0 for free shipping</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shippingLocations">Shipping To</Label>
                  <Select value={shippingLocations} onValueChange={setShippingLocations}>
                    <SelectTrigger id="shippingLocations">
                      <SelectValue placeholder="Select locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domestic">Domestic Only</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                      <SelectItem value="pickup">Local Pickup Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Auction"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
