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
import { CalendarIcon, ImagePlus, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import Image from "next/image"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  
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

  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const uploadedUrls: string[] = []
    
    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Upload failed",
            description: `File "${file.name}" exceeds the 5MB size limit`,
            variant: "destructive",
          })
          continue
        }
        
        // Only allow certain image types
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!validTypes.includes(file.type)) {
          toast({
            title: "Upload failed",
            description: `File "${file.name}" has an unsupported format. Please use JPEG, PNG, GIF or WEBP.`,
            variant: "destructive",
          })
          continue
        }
        
        // Create unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `${fileName}`
        
        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('auction-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })
          
        if (error) {
          console.error('Error uploading file:', error.message)
          toast({
            title: "Upload failed",
            description: error.message,
            variant: "destructive",
          })
          
          // If bucket doesn't exist, try to create it
          if (error.message.includes('bucket') && error.message.includes('not found')) {
            const createResponse = await fetch('/api/storage')
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // Try upload again
            const retryUpload = await supabase.storage
              .from('auction-images')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              })
              
            if (retryUpload.error) {
              console.error('Retry upload failed:', retryUpload.error.message)
            } else {
              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('auction-images')
                .getPublicUrl(filePath)
                
              uploadedUrls.push(publicUrl)
              toast({
                title: "Image uploaded",
                description: `${i + 1} of ${files.length} images uploaded`,
              })
            }
          }
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('auction-images')
            .getPublicUrl(filePath)
            
          uploadedUrls.push(publicUrl)
          toast({
            title: "Image uploaded",
            description: `${i + 1} of ${files.length} images uploaded`,
          })
        }
      }
      
      // Update images state with new URLs
      setImages([...images, ...uploadedUrls])
    } catch (error) {
      console.error('Error in image upload:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate at least one image
      if (images.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one image of your item",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

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
        starting_price: parseFloat(startingPrice),
        reserve_price: reservePrice ? parseFloat(reservePrice) : null,
        category,
        condition,
        end_time: endTime.toISOString(),
        images,
        shipping_cost: shippingCost ? parseFloat(shippingCost) : 0,
        shipping_locations: shippingLocations || "domestic",
        user_id: userId, // Store the user ID of the creator
        status: 'active'
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
                <CardTitle>Images</CardTitle>
                <CardDescription>Upload images of your item (up to 5 images, 5MB max per image)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-36 border-dashed"
                    onClick={handleImageUploadClick}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <ImagePlus className="h-8 w-8 mb-2" />
                        <span>Click to add images</span>
                      </div>
                    )}
                  </Button>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {images.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="rounded-md overflow-hidden border relative h-24">
                          <Image 
                            src={url} 
                            alt={`Auction image ${index + 1}`} 
                            fill 
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute hidden group-hover:flex right-1 top-1 h-6 w-6"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                      placeholder="0.00" 
                      required
                      min="0.01"
                      step="0.01"
                      value={startingPrice}
                      onChange={(e) => setStartingPrice(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reserve-price">Reserve Price ($) (Optional)</Label>
                    <Input 
                      id="reserve-price" 
                      type="number" 
                      placeholder="0.00" 
                      min="0.01"
                      step="0.01"
                      value={reservePrice}
                      onChange={(e) => setReservePrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>End Date and Time</Label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            disabled={date => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="w-20">
                      <Select value={hourValue} onValueChange={setHourValue}>
                        <SelectTrigger>
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(Array(24).keys()).map((hour) => (
                            <SelectItem key={hour} value={hour.toString()}>
                              {hour.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Select value={minuteValue} onValueChange={setMinuteValue}>
                        <SelectTrigger>
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 15, 30, 45].map((minute) => (
                            <SelectItem key={minute} value={minute.toString()}>
                              {minute.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Or select duration</Label>
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
                <CardTitle>Shipping Details</CardTitle>
                <CardDescription>Provide details about shipping.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="shipping-cost">Shipping Cost ($)</Label>
                  <Input 
                    id="shipping-cost" 
                    type="number" 
                    placeholder="0.00 (free shipping)" 
                    min="0"
                    step="0.01"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shipping-locations">Shipping Locations</Label>
                  <Select value={shippingLocations} onValueChange={setShippingLocations}>
                    <SelectTrigger id="shipping-locations">
                      <SelectValue placeholder="Select locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domestic">Domestic Only</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                      <SelectItem value="local-pickup">Local Pickup Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full mt-4" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Auction...
                </>
              ) : (
                'Create Auction'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 