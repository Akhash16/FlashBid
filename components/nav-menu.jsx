"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

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
    await fetch('/auth/signout', { method: 'POST' })
    router.refresh()
  }

  // Helper to determine if a link is active
  const isActive = (path) => {
    if (path === '/') return pathname === path
    return pathname.startsWith(path)
  }

  const NavLink = ({ href, children }) => (
    <Link 
      href={href} 
      className={`transition-colors hover:text-primary ${
        isActive(href) 
          ? 'font-medium text-primary' 
          : 'text-foreground/80'
      }`}
    >
      {children}
    </Link>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold flex items-center gap-2">
          <span className="text-primary">⚡</span> FlashBid
        </Link>

        {/* Desktop navigation only - mobile uses bottom nav instead */}
        <nav className="hidden md:flex gap-6 items-center">
          <NavLink href="/auctions">Auctions</NavLink>
          
          {!loading && user ? (
            <>
              <NavLink href="/auctions/create">Create Auction</NavLink>
              <Button variant="outline" onClick={handleSignOut} size="sm">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild size="sm" className="bg-background hover:bg-secondary">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
} 