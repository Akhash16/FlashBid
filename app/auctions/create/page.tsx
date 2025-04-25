"use client"

import type React from "react"

import { useState } from "react"
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

export default function CreateAuctionPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [endDate, setEndDate] = useState<Date>()

  const handleImageUpload = () => {
    // In a real app, you would handle file uploads
    // For demo purposes, we'll just add placeholder images
    setImages([...images, `/placeholder.svg?height=400&width=600&text=Image ${images.length + 1}`])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Auction created!",
        description: "Your auction has been created and is now live.",
      })
    }, 2000)
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
                  <Input id="title" placeholder="e.g. Vintage Watch Collection" required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your item in detail. Include condition, history, and any other relevant information."
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select required>
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
                    <Select required>
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
                    <Input id="starting-price" type="number" min="1" step="0.01" placeholder="0.00" required />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="reserve-price">Reserve Price ($) (Optional)</Label>
                    <Input id="reserve-price" type="number" min="0" step="0.01" placeholder="0.00" />
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
                    <Select>
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
                    <Select>
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
                  <Select>
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
                  <Input id="shipping-cost" type="number" min="0" step="0.01" placeholder="0.00" />
                  <p className="text-sm text-muted-foreground">Leave at 0 for free shipping</p>
                </div>

                <div className="grid gap-2">
                  <Label>Shipping Locations</Label>
                  <Select>
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
