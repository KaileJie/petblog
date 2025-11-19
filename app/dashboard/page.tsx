'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, FileText, Eye, MessageCircle, Users } from "lucide-react"
import { DashboardStatsCard } from "@/components/dashboard-stats-card"
import { DashboardSearch } from "@/components/dashboard-search"
import { DashboardFilters } from "@/components/dashboard-filters"
import { Suspense } from "react"

function SearchAndFilters() {
  return (
    <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <DashboardSearch />
      <DashboardFilters />
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  
  console.log('🔍 DashboardContent rendered, sessionId:', sessionId, 'URL:', typeof window !== 'undefined' ? window.location.href : 'SSR')
  
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [stats, setStats] = useState<{ totalPosts?: number; totalViews?: number; comments?: number; followers?: number } | null>(null)
  
  // Use ref to track if we've already checked session_id (prevents infinite loops)
  const hasCheckedSessionIdRef = useRef(false)
  const isProcessingRef = useRef(false)

  // Define loadDashboardData outside useEffect so it's accessible everywhere
  const loadDashboardData = async () => {
    // This would normally be server-side, but for now we'll skip it
    // The layout already handles subscription check
  }

  useEffect(() => {
    // Prevent duplicate checks
    if (isProcessingRef.current) {
      console.log('⏸️  Already processing, skipping...')
      return
    }
    
    // Check if URL has session_id parameter (client-side check)
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const urlSessionId = urlParams.get('session_id')
    
    console.log('🔍 useEffect triggered:', {
      sessionIdFromHook: sessionId,
      sessionIdFromURL: urlSessionId,
      hasCheckedBefore: hasCheckedSessionIdRef.current,
    })
    
    // Use URL session_id if hook session_id is not available yet
    const effectiveSessionId = sessionId || urlSessionId
    
    // Prevent duplicate checks when no session_id
    if (hasCheckedSessionIdRef.current && !effectiveSessionId) {
      console.log('⏸️  Already checked without session_id, skipping...')
      return
    }
    
    const verifySubscription = async () => {
      if (!effectiveSessionId) {
        // No session_id - check if user has subscription
        // If not, redirect to subscribe
        console.log('🔍 No session_id, checking subscription status...')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Use orderBy and limit to ensure we get the most recent subscription
          // This handles cases where there might be multiple subscriptions
          const { data: subscription, error: subCheckError } = await supabase
            .from('subscriptions')
            .select('status, stripe_subscription_id, created_at')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          console.log('📊 Subscription check result:', { subscription, userId: user.id, error: subCheckError })
          
          if (subCheckError) {
            console.error('❌ Error checking subscription:', subCheckError)
            // If error is PGRST116 (multiple rows), try to get first one
            if (subCheckError.code === 'PGRST116') {
              console.log('⚠️  Multiple subscriptions found, fetching first active one...')
              const { data: subscriptions } = await supabase
                .from('subscriptions')
                .select('status, stripe_subscription_id, created_at')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
              
              if (subscriptions && subscriptions.length > 0) {
                console.log('✅ Found subscription from multiple results:', subscriptions[0])
                // Continue with first subscription
              }
            }
          }

          if (!subscription) {
            // No subscription found - wait a bit and retry (webhook might still be processing)
            console.log('⏳ No subscription found, waiting for webhook to process...')
            let retries = 3
            let found = false
            
            while (retries > 0 && !found) {
              await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
              
              const { data: retrySubscription, error: retryError } = await supabase
                .from('subscriptions')
                .select('status, stripe_subscription_id, created_at')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
              
              console.log(`📊 Retry check (${4 - retries}/3):`, { retrySubscription, error: retryError })
              
              if (retrySubscription) {
                found = true
                console.log('✅ Subscription found after retry!')
                break
              }
              
              retries--
            }
            
            if (!found) {
              // Still no subscription after retries - redirect to subscribe
              console.log('❌ No subscription found after retries, redirecting to /subscribe')
              router.replace('/subscribe')
              return
            }
          } else {
            console.log('✅ User has active subscription')
          }
        }
        
        setVerifying(false)
        hasCheckedSessionIdRef.current = true
        loadDashboardData()
        return
      }

      console.log('🔍 Processing session_id verification:', effectiveSessionId)
      isProcessingRef.current = true
      setVerifying(true)
      hasCheckedSessionIdRef.current = true

      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setVerificationError('Please log in to verify your subscription')
          setVerifying(false)
          return
        }

        // Call validate-stripe-session edge function
        console.log('🔍 Calling validate-stripe-session with session_id:', effectiveSessionId)
        const { data, error: functionError } = await supabase.functions.invoke('validate-stripe-session', {
          body: { session_id: effectiveSessionId },
        })

        console.log('📥 Validation response:', { data, error: functionError })

        if (functionError) {
          console.error('❌ Verification function error:', functionError)
          isProcessingRef.current = false
          setVerificationError(functionError.message || 'Failed to verify subscription')
          setVerifying(false)
          return
        }

        if (data?.success) {
          console.log('✅ Subscription verified successfully!')
          setVerified(true)
          
          // Verify subscription exists before redirecting
          // validate-stripe-session already saved it, so it should be immediate
          const verifyAndRedirect = async () => {
            console.log('🔍 Verifying subscription was saved to database...')
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
              // Poll for subscription with retries (in case of slight delay)
              let retries = 5
              let subscriptionFound = false
              
              while (retries > 0 && !subscriptionFound) {
                // Use orderBy and limit to handle multiple subscriptions
                const { data: subscription, error: subError } = await supabase
                  .from('subscriptions')
                  .select('status, stripe_subscription_id, created_at')
                  .eq('user_id', user.id)
                  .eq('status', 'active')
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle()
                
                console.log(`📊 Subscription check (retries left: ${retries}):`, { 
                  subscription, 
                  error: subError,
                  userId: user.id 
                })
                
                if (subscription) {
                  subscriptionFound = true
                  console.log('✅ Subscription found in database! Redirecting...')
                  // Reset refs before redirect
                  isProcessingRef.current = false
                  hasCheckedSessionIdRef.current = true
                  // Use window.location.replace to clear URL params and prevent back button issues
                  window.location.replace('/dashboard')
                  return
                }
                
                if (subError) {
                  console.error('❌ Error checking subscription:', subError)
                  
                  // Handle PGRST116 error (multiple rows returned)
                  if (subError.code === 'PGRST116') {
                    console.log('⚠️  Multiple subscriptions found, fetching first active one...')
                    const { data: subscriptions } = await supabase
                      .from('subscriptions')
                      .select('status, stripe_subscription_id, created_at')
                      .eq('user_id', user.id)
                      .eq('status', 'active')
                      .order('created_at', { ascending: false })
                      .limit(1)
                    
                    if (subscriptions && subscriptions.length > 0) {
                      console.log('✅ Found subscription from multiple results:', subscriptions[0])
                      subscriptionFound = true
                      isProcessingRef.current = false
                      hasCheckedSessionIdRef.current = true
                      window.location.replace('/dashboard')
                      return
                    }
                  }
                  
                  // If RLS error, show helpful message
                  if (subError.code === '42501' || subError.message.includes('permission')) {
                    setVerificationError('Permission error: Please check RLS policies for subscriptions table')
                    setVerifying(false)
                    return
                  }
                }
                
                retries--
                if (retries > 0) {
                  console.log(`⏳ Waiting 500ms before retry...`)
                  await new Promise(resolve => setTimeout(resolve, 500))
                }
              }
              
              if (!subscriptionFound) {
                console.error('❌ Subscription not found after retries')
                isProcessingRef.current = false
                setVerificationError('Subscription was verified but not found in database. Please refresh the page.')
                setVerifying(false)
              }
            } else {
              console.error('❌ User not found')
              isProcessingRef.current = false
              setVerificationError('User session expired. Please log in again.')
              setVerifying(false)
            }
          }
          
          // Start verification immediately (validate-stripe-session already saved it)
          verifyAndRedirect()
        } else {
          console.error('❌ Verification failed:', data?.error)
          isProcessingRef.current = false
          setVerificationError(data?.error || 'Subscription verification failed')
          setVerifying(false)
        }
      } catch (err: unknown) {
        console.error('Verification error:', err)
        isProcessingRef.current = false
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while verifying your subscription'
        setVerificationError(errorMessage)
        setVerifying(false)
      }
    }

    verifySubscription()
    // Only depend on sessionId - router is stable and doesn't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <CardTitle className="text-center">Verifying your subscription...</CardTitle>
            <CardDescription className="text-center">
              Please wait while we confirm your payment
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <CardTitle className="text-center">Welcome to PawStories Premium!</CardTitle>
            <CardDescription className="text-center">
              Your subscription is active. Enjoy all premium features!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => {
                setVerified(false)
                loadDashboardData()
              }}
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (verificationError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Verification Failed</CardTitle>
            <CardDescription className="text-center">
              {verificationError}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => router.push('/subscribe')}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Regular dashboard content
  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your blog.
          </p>
        </div>
        <Link href="/dashboard/blogs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div className="mb-8 h-10" />}>
        <SearchAndFilters />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardStatsCard
          title="Total Posts"
          value={stats?.totalPosts || 0}
          icon={FileText}
        />
        <DashboardStatsCard
          title="Total Views"
          value={stats?.totalViews || 0}
          icon={Eye}
        />
        <DashboardStatsCard
          title="Comments"
          value={stats?.comments || 0}
          icon={MessageCircle}
        />
        <DashboardStatsCard
          title="Followers"
          value={stats?.followers || 0}
          icon={Users}
        />
      </div>

      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground mb-4">
          Dashboard content will load here. The subscription check is handled by the layout.
        </p>
        <Link href="/dashboard/blogs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Blog
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
