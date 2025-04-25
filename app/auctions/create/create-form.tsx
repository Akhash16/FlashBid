"use client"

import type React from "react"

import { useState, useRef } from "react"
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
import { createClient } from "@/utils/supabase/client"

interface CreateAuctionFormProps {
  userId: string
}

export default function CreateAuctionForm({ userId }: CreateAuctionFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [endDate, setEndDate] = useState<Date>()
  
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

  const handleImageUpload = () => {
    // In a real app, you would handle file uploads to Supabase Storage
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
        user_id: userId // Store the user ID of the creator
      };

      // Insert the auction into Supabase
      const { data, error } = await supabase
        .from('auctions')
        .insert(auctionData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to create auction');
      }

      toast({
        title: "Auction created!",
        description: "Your auction has been created and is now live.",
      });
      
      // Redirect to the auction page
      router.push(`/auctions/${data.id}`);
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
                <CardTitle>Auction Settings</CardTitle>
                <CardDescription>Set your starting price and auction duration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="starting-price">Starting Price ($)</Label>
                    <Input 
                      id="starting-price" 
                      type="number" 
                      min="1" 
                      step="0.01" 
                      placeholder="0.00" 
                      required 
                      value={startingPrice}
                      onChange={(e) => setStartingPrice(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="reserve-price">Reserve Price ($) (Optional)</Label>
                    <Input 
                      id="reserve-price" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={reservePrice}
                      onChange={(e) => setReservePrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>End Date & Time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground",
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
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Select value={hourValue} onValueChange={setHourValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={minuteValue} onValueChange={setMinuteValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Minute" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 15, 30, 45].map((minute) => (
                          <SelectItem key={minute} value={minute.toString()}>
                            {minute.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Duration</Label>
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
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>
                  Add up to 10 images of your item. The first image will be the main image.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border">
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`Item image ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setImages(images.filter((_, index) => index !== i))}
                        type="button"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}

                  {images.length < 10 && (
                    <Button
                      variant="outline"
                      className="aspect-square flex flex-col items-center justify-center border-dashed"
                      onClick={handleImageUpload}
                      type="button"
                    >
                      <ImagePlus className="h-8 w-8 mb-2" />
                      <span>Add Image</span>
                    </Button>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">{images.length} of 10 images added</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping</CardTitle>
                <CardDescription>Provide shipping details for your item.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="shipping-cost">Shipping Cost ($)</Label>
                  <Input 
                    id="shipping-cost" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">Leave at 0 for free shipping</p>
                </div>

                <div className="grid gap-2">
                  <Label>Shipping Locations</Label>
                  <Select value={shippingLocations} onValueChange={setShippingLocations}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shipping locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domestic">Domestic Only</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                      <SelectItem value="worldwide">Worldwide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Button variant="outline" type="button">
              Save as Draft
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
        </form>
      </div>
    </div>
  )
} 