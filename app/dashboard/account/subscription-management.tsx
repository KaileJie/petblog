'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CreditCard } from 'lucide-react'

export default function SubscriptionManagement() {
  const [loading, setLoading] = useState(false)

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Call Edge Function to create portal session
      const { data, error } = await supabase.functions.invoke('stripe-portal')

      if (error) {
        throw error
      }

      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('No portal URL received')
      }
    } catch (err: unknown) {
      console.error('Error opening portal:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to open subscription portal'
      alert(errorMessage)
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleManageSubscription}
      disabled={loading}
      className="w-full sm:w-auto"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Manage Subscription
        </>
      )}
    </Button>
  )
}

