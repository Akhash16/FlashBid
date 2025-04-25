"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Package, PlusCircle, User, LogIn } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"

export function BottomNav() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
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
      if (event === 'SIGNED_IN') {
        setUser(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [supabase.auth])
  
  // Helper to determine if a link is active
  const isActive = (path) => {
    if (path === "/" && pathname === "/") return true
    return pathname.startsWith(path) && path !== "/"
  }
  
  // Common navigation items
  const commonNavItems = [
    {
      href: "/",
      label: "Home",
      icon: Home
    },
    {
      href: "/auctions",
      label: "Auctions",
      icon: Package
    }
  ]
  
  // Authenticated user navigation items
  const authNavItems = [
    {
      href: "/auctions/create",
      label: "Create",
      icon: PlusCircle
    },
    {
      href: "/profile",
      label: "Profile",
      icon: User
    }
  ]
  
  // Non-authenticated navigation items
  const nonAuthNavItems = [
    {
      href: "/auth/signin",
      label: "Sign In",
      icon: LogIn
    }
  ]
  
  // Determine which nav items to show based on auth state
  const navItems = [
    ...commonNavItems,
    ...(!loading && user ? authNavItems : nonAuthNavItems)
  ]
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
      <nav className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-4 ${
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
} 