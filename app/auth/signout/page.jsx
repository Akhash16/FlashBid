"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function SignOut() {
  const [error, setError] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        // First try the server-side signout
        const response = await fetch('/auth/signout', { 
          method: 'GET',
          cache: 'no-store'
        })
        
        if (!response.ok) {
          // If server-side fails, try client-side
          await supabase.auth.signOut()
          router.push('/')
          router.refresh()
        }
        // If server-side succeeds, we'll be redirected automatically
      } catch (error) {
        console.error('Error signing out:', error)
        setError(error.message)
        
        // Try client-side signout as a fallback
        try {
          await supabase.auth.signOut()
          router.push('/')
          router.refresh()
        } catch (clientError) {
          console.error('Client-side signout also failed:', clientError)
        }
      }
    }

    handleSignOut()
  }, [router, supabase.auth])

  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Signing out</CardTitle>
          <CardDescription className="text-center">
            {error ? 'An error occurred. Trying alternative method...' : 'You are being logged out and redirected...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  )
} 