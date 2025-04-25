"use client"

import { useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function PageTransition({ children }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)

  // Watch for changes in the route
  useEffect(() => {
    const url = pathname + searchParams.toString()
    
    // Start transition
    setIsTransitioning(true)
    
    // Short delay before updating content
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      // End transition
      setIsTransitioning(false)
    }, 200)
    
    return () => clearTimeout(timer)
  }, [pathname, searchParams, children])

  return (
    <div
      className={`transition-opacity duration-200 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {displayChildren}
    </div>
  )
} 