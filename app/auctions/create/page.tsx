"use client"

import { useState, useEffect, useRef } from "react"
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
import { CalendarIcon, ImagePlus, Loader2, X, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { createClient } from '@/utils/supabase/client'
import Image from "next/image"

export default function CreateAuctionPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // Initialize storage bucket
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Check if Supabase is properly initialized first
        const { data: { session } } = await supabase.auth.getSession();
        
        // Skip storage initialization if not authenticated
        if (!session) {
          console.log('Skipping storage initialization - user not authenticated');
          return;
        }
        
        // First initialize the bucket with error handling
        try {
          const storageResponse = await fetch('/api/storage');
          const storageData = await storageResponse.json();
          
          if (!storageData.success) {
            console.error('Failed to initialize storage bucket:', storageData.error);
            
            // Check if this is a permissions error that needs admin action
            if (storageData.adminAction) {
              toast({
                title: "Storage Setup Info",
                description: storageData.message || "The storage system is being configured. You can continue using the app.",
              });
              return;
            }
            
            // Non-critical error, just log and continue
            console.warn('Storage setup issue:', storageData.error);
            return;
          }
          
          console.log('Storage bucket initialized successfully');
        } catch (storageError) {
          console.error('Error calling storage API:', storageError);
          // Non-critical error, continue with the app
          return;
        }
        
        // Then check if the bucket exists before configuring the policy
        try {
          const checkResponse = await fetch('/api/storage/check');
          const checkData = await checkResponse.json();
          
          if (!checkData.success) {
            console.warn('Storage check issue:', checkData.error || 'Unknown error');
            // Non-critical error, continue with the app
            return;
          }
          
          console.log('Storage bucket check successful');
        } catch (checkError) {
          console.error('Error checking storage bucket:', checkError);
          // Non-critical error, continue with the app
          return;
        }
        
        // Then configure the policy with error handling
        try {
          const policyResponse = await fetch('/api/storage/policy');
          
          if (!policyResponse.ok) {
            console.warn('Storage policy setup issue:', policyResponse.status, policyResponse.statusText);
            // Non-critical error, continue with the app
            return;
          }
          
          const policyData = await policyResponse.json();
          
          if (!policyData.success) {
            console.warn('Storage policy configuration issue:', policyData.error || 'Unknown error');
            // Non-critical error, continue with the app
            return;
          }
          
          console.log('Storage policies configured successfully');
        } catch (policyError) {
          console.error('Error configuring storage policies:', policyError);
          // Non-critical error, continue with the app
          return;
        }
        
        console.log('Storage initialization complete');
      } catch (error) {
        // Catch-all for any unexpected errors
        console.error('Error in storage initialization:', error);
        // Don't show toast for every error to avoid overwhelming the user
        // Continue with the app regardless of storage setup issues
      }
    };
    
    // Only run storage initialization if user is logged in
    if (!loading && userId) {
      initializeStorage();
    }
  }, [toast, supabase.auth, loading, userId]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Limit to 5 images
      if (imageFiles.length + newFiles.length > 5) {
        toast({
          title: "Too many images",
          description: "You can upload a maximum of 5 images per auction.",
          variant: "destructive",
        });
        return;
      }
      
      // Add the new files to our state
      setImageFiles(prev => [...prev, ...newFiles]);
      
      // Create preview URLs for the images
      const newImageUrls = newFiles.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...newImageUrls]);
    }
  };

  const handleImageUploadClick = () => {
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const removeImage = (index: number) => {
    // Remove the image from both arrays
    const newFiles = [...imageFiles];
    const newUrls = [...imageUrls];
    
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(newUrls[index]);
    
    newFiles.splice(index, 1);
    newUrls.splice(index, 1);
    
    setImageFiles(newFiles);
    setImageUrls(newUrls);
  };

  const uploadImagesToStorage = async (): Promise<{success: boolean; urls: string[]; error?: string}> => {
    if (imageFiles.length === 0) return {success: true, urls: []};
    
    setImageUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      // First check if the user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, urls: [], error: "You must be logged in to upload images" };
      }
      
      // Ensure the storage bucket exists by calling our check API
      try {
        const checkResponse = await fetch('/api/storage/check');
        const checkData = await checkResponse.json();
        
        if (!checkData.exists) {
          console.log('Bucket not found, creating...');
          // Create bucket if it doesn't exist
          const createResponse = await fetch('/api/storage');
          const createData = await createResponse.json();
          
          if (!createData.success) {
            return {
              success: false,
              urls: [],
              error: createData.message || 'Failed to create storage bucket'
            };
          }
          
          // Wait for the bucket to be ready
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error('Error checking bucket:', error);
        // Continue anyway, we'll handle errors during upload
      }
      
      console.log('Starting file uploads...');
      
      // Upload each file to Supabase Storage
      for (const file of imageFiles) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          const errorMsg = `File "${file.name}" exceeds the 5MB size limit`;
          toast({
            title: "Upload failed",
            description: errorMsg,
            variant: "destructive",
          });
          return {success: false, urls: uploadedUrls, error: errorMsg};
        }
        
        // Only allow certain image types
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          const errorMsg = `File "${file.name}" has an unsupported format. Please use JPEG, PNG, GIF or WEBP.`;
          toast({
            title: "Upload failed",
            description: errorMsg,
            variant: "destructive",
          });
          return {success: false, urls: uploadedUrls, error: errorMsg};
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${fileName}`; // Bucket name is specified in the upload method
        
        // Try to upload the file with retries for intermittent issues
        const uploadResult = await uploadFileWithRetry(file, filePath);
        
        if (!uploadResult.success) {
          return {
            success: false, 
            urls: uploadedUrls, 
            error: uploadResult.error || "Failed to upload file"
          };
        }
        
        // Ensure url is a string before pushing
        if (uploadResult.url) {
          uploadedUrls.push(uploadResult.url);
        }
        
        // Show progress toast for each successful upload
        toast({
          title: "Image uploaded",
          description: `${uploadedUrls.length} of ${imageFiles.length} images uploaded`,
        });
      }
      
      console.log('All files uploaded successfully!');
      return {success: true, urls: uploadedUrls};
    } catch (error) {
      console.error('Error in image upload process:', error);
      return {
        success: false, 
        urls: uploadedUrls, 
        error: error instanceof Error ? error.message : "An unexpected error occurred during upload"
      };
    } finally {
      setImageUploading(false);
    }
  }
  
  // Helper function to upload a file with retries
  const uploadFileWithRetry = async (file: File, filePath: string, maxRetries = 3): Promise<{success: boolean; url?: string; error?: string}> => {
    let retries = maxRetries;
    
    while (retries > 0) {
      try {
        console.log(`Uploading file "${file.name}" (${retries} retries left)...`);
        
        // Simple direct upload attempt
        const { data, error } = await supabase.storage
          .from('auction-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true // Set to true to avoid conflicts
          });
          
        if (error) {
          console.error(`Upload attempt failed (${retries} retries left):`, error);
          
          // Check for policy errors
          if (error.message && (
              error.message.includes('policy') || 
              error.message.includes('permission') || 
              error.message.includes('not allowed')
          )) {
            return {
              success: false,
              error: "Permission denied. Please ensure you're logged in and have the proper permissions."
            };
          }
          
          // For bucket not found errors
          if (error.message && error.message.toLowerCase().includes('bucket') && 
              error.message.toLowerCase().includes('not found')) {
            
            console.log('Bucket not found, attempting to create...');
            // Create the bucket
            try {
              const res = await fetch('/api/storage');
              await res.json(); // Just to consume the response
              
              // Wait a moment for the bucket to be created
              await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (createError) {
              console.error('Error creating bucket:', createError);
            }
          }
          
          retries--;
          
          // Wait longer between each retry
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          } else {
            return {
              success: false,
              error: `Failed to upload "${file.name}" after multiple attempts: ${error.message}`
            };
          }
        } else {
          // Success - get public URL
          try {
            const { data: { publicUrl } } = supabase.storage
              .from('auction-images')
              .getPublicUrl(filePath);
              
            if (!publicUrl) {
              throw new Error("Failed to generate public URL");
            }
            
            return {
              success: true,
              url: publicUrl
            };
          } catch (urlError) {
            console.error("Error getting public URL:", urlError);
            return {
              success: false,
              error: "File uploaded but couldn't get public URL"
            };
          }
        }
      } catch (error) {
        console.error(`Upload exception (${retries} retries left):`, error);
        retries--;
        
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown upload error"
          };
        }
      }
    }
    
    // This should not be reached, but just in case
    return {
      success: false,
      error: "Failed to upload file after exhausting all retries"
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First check if all required fields are provided
      if (!title || !description || !startingPrice || !category || !condition) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Upload images first
      const uploadResult = await uploadImagesToStorage();
      
      if (!uploadResult.success) {
        console.error("Image upload failed:", uploadResult.error);
        // Error was already displayed in toast from the upload function
        setIsSubmitting(false);
        return;
      }
      
      const uploadedImageUrls = uploadResult.urls;
      
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

      // Format the data for the API using snake_case as expected by the database
      const auctionData = {
        title,
        description,
        starting_price: parseFloat(startingPrice),
        reserve_price: reservePrice ? parseFloat(reservePrice) : null,
        category,
        condition,
        end_time: endTime.toISOString(),
        images: uploadedImageUrls,
        shipping_cost: shippingCost ? parseFloat(shippingCost) : 0,
        shipping_locations: shippingLocations || "domestic",
        status: 'active',
        start_time: new Date().toISOString(),
        user_id: userId // Explicitly include the user ID
      };

      // Use Supabase client directly instead of fetch
      const { data, error } = await supabase
        .from('auctions')
        .insert(auctionData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to create auction');
      }

      toast({
        title: "Success!",
        description: "Your auction has been created.",
      });
      
      // Redirect to the auction page
      if (data && data.id) {
        router.push(`/auctions/${data.id}`);
      } else {
        router.push('/auctions'); // Fallback to auctions list
      }
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Create Your Auction</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Fill in the details below to list your item for auction. Quality listings with good photos sell faster!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="overflow-hidden border-none shadow-lg">
            <div className="h-2 bg-gradient-to-r from-primary to-primary-foreground/20"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <span className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-primary">1</span>
                Basic Information
              </CardTitle>
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
                  className="transition-all focus-visible:ring-primary"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item in detail. Include condition, history, and any other relevant information."
                  className="min-h-[120px] transition-all focus-visible:ring-primary"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select required value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="transition-all focus-visible:ring-primary">
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
                    <SelectTrigger id="condition" className="transition-all focus-visible:ring-primary">
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

          <Card className="overflow-hidden border-none shadow-lg">
            <div className="h-2 bg-gradient-to-r from-yellow-500 to-amber-300"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <span className="bg-yellow-500/10 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-yellow-600">2</span>
                Pricing
              </CardTitle>
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
                    className="transition-all focus-visible:ring-yellow-500"
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
                    className="transition-all focus-visible:ring-yellow-500"
                  />
                  <p className="text-xs text-muted-foreground">Minimum price for the item to sell. Hidden from bidders.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-lg">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <span className="bg-blue-500/10 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-blue-600">3</span>
                Duration
              </CardTitle>
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
                          "w-full justify-start text-left font-normal transition-all focus-visible:ring-blue-500",
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
                      <SelectTrigger id="hourValue" className="transition-all focus-visible:ring-blue-500">
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
                      <SelectTrigger id="minuteValue" className="transition-all focus-visible:ring-blue-500">
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
                  <SelectTrigger className="transition-all focus-visible:ring-blue-500">
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

          <Card className="overflow-hidden border-none shadow-lg">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-violet-400"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <span className="bg-purple-500/10 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-purple-600">4</span>
                Images
              </CardTitle>
              <CardDescription>Upload images of your item (maximum 5 images).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {imageUrls.map((image, index) => (
                    <div 
                      key={index} 
                      className="aspect-square bg-muted rounded-md overflow-hidden relative flex items-center justify-center group shadow-sm"
                    >
                      <Image 
                        src={image} 
                        alt={`Product image ${index + 1}`} 
                        fill
                        className="object-cover transition-all group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-black/90"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  {imageUrls.length < 5 && (
                    <button
                      type="button"
                      className="aspect-square bg-muted/40 rounded-md flex flex-col items-center justify-center gap-1 border-2 border-dashed transition-all hover:bg-muted/60"
                      onClick={handleImageUploadClick}
                      disabled={imageUploading}
                    >
                      {imageUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                      ) : (
                        <>
                          <ImagePlus className="h-6 w-6 text-purple-500" />
                          <span className="text-xs text-muted-foreground font-medium">Add Image</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <div className="bg-muted/30 p-3 rounded-md text-sm text-muted-foreground">
                  <p className="flex items-center">
                    <Upload className="h-4 w-4 mr-2" />
                    Images help your item sell faster. Add up to 5 high-quality images.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-lg">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-400"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <span className="bg-green-500/10 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-green-600">5</span>
                Shipping
              </CardTitle>
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
                  className="transition-all focus-visible:ring-green-500"
                />
                <p className="text-xs text-muted-foreground">Enter 0 for free shipping</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="shippingLocations">Shipping To</Label>
                <Select value={shippingLocations} onValueChange={setShippingLocations}>
                  <SelectTrigger id="shippingLocations" className="transition-all focus-visible:ring-green-500">
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
          
          <div className="flex justify-center mt-10">
            <Button 
              type="submit" 
              disabled={isSubmitting || imageUploading} 
              className="min-w-[200px] py-6 text-lg font-medium bg-gradient-to-r from-primary to-purple-600 hover:from-primary/95 hover:to-purple-600/95 shadow-lg transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
