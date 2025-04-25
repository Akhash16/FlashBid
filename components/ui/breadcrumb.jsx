"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { BackButton } from "@/components/ui/back-button"

export function Breadcrumb({ className, ...props }) {
  const pathname = usePathname()
  
  // Skip rendering on homepage
  if (pathname === "/") return null
  
  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    // Remove trailing slash and split path into segments
    const pathSegments = pathname.replace(/\/$/, "").split("/").filter(Boolean)
    let breadcrumbs = []
    
    // Create an array of breadcrumb items
    breadcrumbs.push({
      href: "/",
      label: <Home size={16} />
    })
    
    // Build up breadcrumb items by accumulating path segments
    let currentPath = ""
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Generate human-readable label from segment
      let label = segment
        .replace(/-/g, " ")
        .replace(/\[|\]/g, "") // Remove brackets from dynamic segments
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
      
      breadcrumbs.push({
        href: currentPath,
        label: label,
        isCurrentPage: index === pathSegments.length - 1
      })
    })
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs()
  
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <BackButton />
      
      <nav 
        aria-label="Breadcrumb" 
        className="flex items-center text-sm text-muted-foreground"
        {...props}
      >
        <ol className="flex items-center space-x-2">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={breadcrumb.href} className="flex items-center">
              {index > 0 && <ChevronRight className="mx-1" size={14} />}
              
              {breadcrumb.isCurrentPage ? (
                <span className="font-medium text-foreground">
                  {breadcrumb.label}
                </span>
              ) : (
                <Link 
                  href={breadcrumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {breadcrumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
} 