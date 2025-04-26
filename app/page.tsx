"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Award, Clock, DollarSign, LogIn, LogOut, Shield, Star, Tag, Truck, UserPlus, Users } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import Image from "next/image"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    
    getUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Debug function to test Supabase connection
  useEffect(() => {
    const testSupabase = async () => {
      try {
        const { data, error } = await supabase.from('auctions').select('*').limit(3)
        
        if (error) {
          console.error('Supabase error:', error)
          setDebugInfo(`Error: ${error.message}`)
        } else {
          console.log('Direct Supabase query result:', data)
          setFeaturedAuctions(data || [])
        }
      } catch (err) {
        console.error('Test error:', err)
      }
    }
    
    testSupabase()
  }, [])

  const [featuredAuctions, setFeaturedAuctions] = useState<any[]>([])

  return (
    <div className="flex flex-col min-h-screen bg-[#111827] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#111827] pb-16 pt-10 md:pb-24 md:pt-16">
        {/* Abstract shapes */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl"></div>
        <div className="absolute top-1/2 -left-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"></div>
        
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  <span className="inline bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Flash</span>Bid
                </h1>
                <p className="text-xl text-gray-300 md:text-2xl/relaxed lg:text-3xl/relaxed xl:text-4xl/relaxed">
                  The Next Generation Auction Platform
                </p>
              </div>
              <p className="max-w-[600px] text-gray-400 md:text-xl">
                Discover unique items, place bids in real-time, and experience the thrill of winning auctions. Create your own listings and reach buyers worldwide.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium border-0">
                  <Link href="/auctions">
                    Browse Auctions <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {user ? (
                  <Button asChild variant="outline" size="lg" className="border-gray-700 text-gray-200 hover:bg-gray-800">
                    <Link href="/auctions/create">Create Auction</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="lg" className="border-gray-700 text-gray-200 hover:bg-gray-800">
                    <Link href="/auth/signup">
                      <UserPlus className="mr-2 h-4 w-4" /> Get Started
                    </Link>
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Shield className="h-4 w-4 text-blue-400" /> Secure payments
                <span className="mx-2">•</span>
                <Users className="h-4 w-4 text-blue-400" /> Active community
                <span className="mx-2">•</span>
                <Award className="h-4 w-4 text-blue-400" /> Verified sellers
              </div>
            </div>
            <div className="flex items-center justify-center lg:justify-end">
              <div className="relative h-[350px] w-[350px] sm:h-[400px] sm:w-[400px] md:h-[450px] md:w-[450px] lg:h-[500px] lg:w-[500px]">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-900/20 via-purple-800/10 to-blue-900/20 shadow-lg"></div>
                <div className="absolute -right-4 -top-4 h-full w-full rounded-3xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm shadow-lg transform rotate-6"></div>
                <div className="absolute -left-4 -bottom-4 h-full w-full rounded-3xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm shadow-lg transform -rotate-3"></div>
                <div className="absolute inset-0 rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800"></div>
                  <div className="relative h-full w-full p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Trending Item</div>
                        <h3 className="text-xl font-semibold text-white">Vintage Collector's Watch</h3>
                        <p className="text-gray-400 text-sm mt-1">Limited Edition #172/500</p>
                      </div>
                      <div className="px-3 py-1 bg-blue-500/10 rounded-full text-blue-400 text-sm font-medium">Ending soon</div>
                    </div>
                    <div className="my-4 rounded-xl bg-gray-800/50 overflow-hidden relative h-48">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        Image placeholder
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-400">Current bid</div>
                        <div className="text-lg font-semibold text-white">$2,450.00</div>
                      </div>
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white border-0">Place Bid</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-[#1a202c] py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-gray-800 px-3 py-1 text-sm text-gray-300">Why choose FlashBid</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">Powerful Features</h2>
              <p className="max-w-[700px] text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Everything you need for a seamless auction experience.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 shadow-lg transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <CardTitle className="text-white">Real-Time Bidding</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-400">
                  Experience sub-second bid updates with WebSockets. See bids as they happen with smooth countdown timers.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 shadow-lg transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <DollarSign className="h-5 w-5 text-purple-400" />
                </div>
                <CardTitle className="text-white">Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-400">
                  Integrated with Stripe for secure payments. Funds are held in escrow until the auction completes.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 shadow-lg transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <CardTitle className="text-white">User Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-400">
                  Get notified when you're outbid or when auctions you're watching are ending soon.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 shadow-lg transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-400" />
                </div>
                <CardTitle className="text-white">Buyer Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-400">
                  All transactions are covered by our buyer protection program, ensuring a safe and secure experience.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 shadow-lg transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Tag className="h-5 w-5 text-blue-400" />
                </div>
                <CardTitle className="text-white">Smart Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-400">
                  Browse items by category with our intelligent filtering system. Find exactly what you're looking for.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 shadow-lg transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Truck className="h-5 w-5 text-purple-400" />
                </div>
                <CardTitle className="text-white">Integrated Shipping</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-400">
                  Track shipments directly on the platform. Shipping options automatically calculated for each item.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Auctions */}
      <section className="py-16 md:py-24 bg-[#111827]">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-gray-800 px-3 py-1 text-sm text-gray-300">Don't miss out</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">Featured Auctions</h2>
              <p className="max-w-[700px] text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Explore our most popular and trending auctions.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredAuctions.length > 0 ? (
              featuredAuctions.map((auction, i) => (
                <Card key={auction.id || i} className="overflow-hidden border border-gray-800 bg-gray-900 shadow-lg transition-all hover:shadow-xl">
                  <div className="aspect-[4/3] bg-gray-800 relative overflow-hidden">
                    {auction.images && auction.images[0] && (
                      <Image 
                        src={auction.images[0]} 
                        alt={auction.title || `Auction ${i}`}
                        className="object-cover transition-transform hover:scale-105"
                        fill
                      />
                    )}
                    <div className="absolute bottom-0 right-0 bg-blue-500/70 text-white px-3 py-1 text-sm font-medium rounded-tl-lg backdrop-blur-sm">
                      Ends soon
                    </div>
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="line-clamp-1 text-white">{auction.title || `Vintage Collection #${i+1}`}</CardTitle>
                    <CardDescription className="flex justify-between text-gray-400">
                      <span>Current bid: ${auction.current_bid || auction.starting_price || (150 + i * 50)}</span>
                      <span className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" /> 4.{9-i}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="line-clamp-2 text-sm text-gray-400 mb-4">
                      {auction.description || `This is a fantastic auction item with great value and an amazing history. Don't miss out on this unique opportunity!`}
                    </p>
                    <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0">
                      <Link href={`/auctions/${auction.id || i}`}>View Auction</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden border border-gray-800 bg-gray-900 shadow-lg">
                  <div className="aspect-[4/3] bg-gray-800 relative">
                    <div className="absolute bottom-0 right-0 bg-blue-500/70 text-white px-3 py-1 text-sm font-medium rounded-tl-lg backdrop-blur-sm">
                      Ends soon
                    </div>
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="line-clamp-1 text-white">Vintage Collection #{i+1}</CardTitle>
                    <CardDescription className="flex justify-between text-gray-400">
                      <span>Current bid: ${150 + i * 50}</span>
                      <span className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" /> 4.{9-i}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="line-clamp-2 text-sm text-gray-400 mb-4">
                      This is a fantastic auction item with great value and an amazing history. Don't miss out on this unique opportunity!
                    </p>
                    <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0">
                      <Link href={`/auctions/${i+1}`}>View Auction</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="flex justify-center mt-8">
            <Button asChild variant="outline" size="lg" className="border-gray-700 text-gray-200 hover:bg-gray-800">
              <Link href="/auctions">
                View All Auctions <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#1a202c] py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-gray-800 px-3 py-1 text-sm text-gray-300">Testimonials</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">What Our Users Say</h2>
              <p className="max-w-[700px] text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Thousands of users trust FlashBid for their online auction needs.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gray-900 border border-gray-800 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center font-semibold text-xl text-blue-300">J</div>
                  <div>
                    <CardTitle className="text-base text-white">James Wilson</CardTitle>
                    <CardDescription className="text-gray-400">Collector</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex mb-2">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-400">
                  "FlashBid has completely transformed how I discover rare collectibles. The real-time bidding experience is thrilling and I've added several valuable pieces to my collection."
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border border-gray-800 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center font-semibold text-xl text-purple-300">S</div>
                  <div>
                    <CardTitle className="text-base text-white">Sarah Johnson</CardTitle>
                    <CardDescription className="text-gray-400">Antique Dealer</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex mb-2">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-400">
                  "As a seller, FlashBid has expanded my customer base exponentially. The platform is intuitive and I love how easy it is to create attractive listings."
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border border-gray-800 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center font-semibold text-xl text-blue-300">M</div>
                  <div>
                    <CardTitle className="text-base text-white">Michael Chen</CardTitle>
                    <CardDescription className="text-gray-400">Tech Enthusiast</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex mb-2">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-400">
                  "The notification system is fantastic - I never miss out on the items I'm watching. Security is top-notch and I feel confident with every transaction."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-[#111827]">
        <div className="container px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 px-6 py-16 text-center shadow-lg">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center mix-blend-soft-light opacity-20"></div>
            <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
            
            <div className="relative mx-auto max-w-3xl space-y-6">
              <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">Ready to Start Bidding?</h2>
              <p className="text-xl text-white/80">
                Join thousands of users buying and selling on FlashBid every day.
                Create your free account and dive into the exciting world of online auctions.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-white/90 border-0">
                  <Link href="/auth/signup">
                    Create Free Account
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10 hover:text-white">
                  <Link href="/auctions">
                    Browse Auctions
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
