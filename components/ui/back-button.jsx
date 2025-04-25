"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export function BackButton({ 
  fallbackUrl = "/", 
  label = "Back", 
  variant = "ghost", 
  size = "sm",
  className = "", 
  ...props 
}) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Skip rendering on homepage
  if (pathname === "/") return null
  
  const handleBack = () => {
    // Try to go back in history if possible
    if (window.history.length > 1) {
      router.back()
    } else {
      // If no history exists, navigate to fallback URL
      router.push(fallbackUrl)
    }
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      className={`flex items-center gap-1 ${className}`}
      onClick={handleBack}
      {...props}
    >
      <ChevronLeft size={16} />
      {label}
    </Button>
  )
} 