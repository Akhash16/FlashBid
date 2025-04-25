"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Clock, DollarSign, LogIn, LogOut, UserPlus, Users } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
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

  const handleSignOut = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    await fetch('/auth/signout', { method: 'GET' })
    window.location.href = '/'
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Live Auction Platform</h1>
          <p className="max-w-[700px] text-gray-500 md:text-xl">
            Bid on exclusive items in real-time. Create your own auctions and earn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button asChild size="lg">
              <Link href="/auctions">
                Browse Auctions <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {user ? (
              <Button asChild variant="outline" size="lg">
                <Link href="/auctions/create">Create Auction</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700">
                <Link href="/auth/signup">
                  <UserPlus className="mr-2 h-5 w-5" /> Get Started
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Real-Time Bidding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Experience sub-second bid updates with WebSockets. See bids as they happen with smooth countdown timers.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Secure Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Integrated with Stripe for secure payments. Funds are held in escrow until the auction completes.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                User Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get notified when you're outbid or when auctions you're watching are ending soon.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="border rounded-lg p-6 mb-12">
          <h2 className="text-2xl font-bold mb-4">Featured Auctions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  <div className="absolute bottom-0 right-0 bg-black/70 text-white px-2 py-1 text-sm">Ends in 2h 45m</div>
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Vintage Watch Collection #{i}</CardTitle>
                  <CardDescription>Current bid: $1,{i}50.00</CardDescription>
                </CardHeader>
                <CardFooter className="p-4 pt-0">
                  <Button asChild className="w-full">
                    <Link href={`/auctions/${i}`}>View Auction</Link>
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
