"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"

export default function NavMenu() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    
    getUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    try {
      // First try the server route
      await fetch('/auth/signout', { method: 'POST' })
      // Also sign out on the client side
      await supabase.auth.signOut()
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
      // Fallback to client-side only
      await supabase.auth.signOut()
      router.refresh()
    }
  }

  // Helper to determine if a link is active
  const isActive = (path) => {
    if (path === '/') return pathname === path
    return pathname.startsWith(path)
  }

  const NavLink = ({ href, children }) => (
    <Link 
      href={href} 
      className={`transition-colors hover:text-blue-400 ${
        isActive(href) 
          ? 'font-medium text-blue-400' 
          : 'text-gray-300'
      }`}
    >
      {children}
    </Link>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-[#1a202c]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1a202c]/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold flex items-center gap-2">
          <img src="/main_logo.png" alt="FlashBid Logo" className="h-9 w-auto" />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">FlashBid</span>
        </Link>

        {/* Desktop navigation only - mobile uses bottom nav instead */}
        <nav className="hidden md:flex gap-6 items-center">
          <NavLink href="/auctions">Auctions</NavLink>
          
          {!loading && user ? (
            <>
              <NavLink href="/auctions/create">Create Auction</NavLink>
              <Button variant="outline" onClick={handleSignOut} size="sm" className="border-gray-700 text-gray-200 hover:bg-gray-800">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild size="sm" className="border-gray-700 text-gray-200 hover:bg-gray-800">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
} 