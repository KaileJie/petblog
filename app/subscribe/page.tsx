'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { SiteHeader } from '@/components/header'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function SubscribePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingSubscription, setCheckingSubscription] = useState(true)
  const [hasSubscription, setHasSubscription] = useState(false)

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setCheckingSubscription(false)
          return
        }

        // Check if user has active subscription
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('status, stripe_subscription_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        console.log('Subscription check result:', { subscription, subError })

        // If subscription exists, verify it's stable before redirecting
        if (subscription) {
          console.log('User has active subscription, verifying before redirect...')
          setHasSubscription(true)
          
          // Wait a moment to ensure subscription is stable, then redirect
          // This prevents race conditions with webhook processing
          setTimeout(() => {
            // Double-check subscription still exists before redirecting
            supabase
              .from('subscriptions')
              .select('status, stripe_subscription_id')
              .eq('user_id', user.id)
              .eq('status', 'active')
              .maybeSingle()
              .then(({ data: verifySub }) => {
                if (verifySub) {
                  console.log('✅ Subscription verified, redirecting to dashboard')
                  router.replace('/dashboard')
                } else {
                  console.log('⚠️ Subscription disappeared, staying on subscribe page')
                  setHasSubscription(false)
                }
              })
          }, 500)
          return
        }

        // If no subscription found, allow subscription
        console.log('No active subscription found, showing subscribe page')
        setHasSubscription(false)
      } catch (err) {
        console.error('Error checking subscription:', err)
        // On error, allow user to try subscribing
        setHasSubscription(false)
      } finally {
        setCheckingSubscription(false)
      }
    }

    checkSubscription()
  }, [router])

  const handleSubscribe = async () => {
    // Prevent multiple simultaneous calls
    if (loading) {
      console.log('⏸️ Subscribe already in progress, ignoring duplicate call')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError('Please log in to subscribe')
        setLoading(false)
        return
      }

      // Get price ID from environment variable
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
      
      if (!priceId) {
        setError('Stripe Price ID is not configured. Please contact support.')
        setLoading(false)
        return
      }

      console.log('🔄 Calling stripe-checkout function...')
      // Call Supabase Edge Function to create checkout session
      const { data, error: functionError } = await supabase.functions.invoke('stripe-checkout', {
        body: { priceId },
      })
      
      console.log('📥 stripe-checkout response:', { data, error: functionError })

      if (functionError) {
        console.error('Function error:', functionError)
        const errorMessage = functionError.message || 'Failed to create checkout session'
        const errorContext = functionError.context ? `: ${JSON.stringify(functionError.context)}` : ''
        throw new Error(`${errorMessage}${errorContext}`)
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else if (data?.error) {
        throw new Error(data.error)
      } else {
        throw new Error('No checkout URL received from server')
      }
    } catch (err: unknown) {
      console.error('Subscribe error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create checkout session. Please try again.'
      setError(errorMessage)
      setLoading(false)
    }
  }

  if (checkingSubscription) {
    return (
      <>
        <SiteHeader />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    )
  }

  if (hasSubscription) {
    // This should rarely show since we redirect immediately
    return (
      <>
        <SiteHeader />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <CardTitle className="text-3xl text-center">You&apos;re Already Subscribed!</CardTitle>
                <CardDescription className="text-center">
                  Your subscription is active. Redirecting to dashboard...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Button onClick={() => router.replace('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Subscribe to PawStories Premium</CardTitle>
              <CardDescription>
                Unlock full access to create and manage your blog posts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">What&apos;s included:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Create unlimited blog posts</li>
                  <li>Edit and delete your posts</li>
                  <li>Access to dashboard features</li>
                  <li>Priority support</li>
                </ul>
              </div>

              <div className="pt-4">
                <p className="text-2xl font-bold mb-1">$5.99/month</p>
                <p className="text-sm text-muted-foreground mb-4">Billed monthly</p>
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
                    {error}
                  </div>
                )}
                <Button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
