import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get session_id from request body
    const body = await req.json()
    const { session_id } = body
    
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'session_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')?.trim()
    if (!stripeSecretKey || (!stripeSecretKey.startsWith('sk_test_') && !stripeSecretKey.startsWith('sk_live_'))) {
      return new Response(
        JSON.stringify({ error: 'Stripe Secret Key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Retrieve Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription'],
    })

    // Verify payment status
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      return new Response(
        JSON.stringify({ error: 'Payment not completed', payment_status: session.payment_status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user ID matches
    const sessionUserId = session.metadata?.supabase_user_id
    if (sessionUserId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Session user ID mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get subscription details
    // When using expand, subscription might be an object, otherwise it's a string ID
    let subscriptionId: string
    let subscription: Stripe.Subscription
    
    if (typeof session.subscription === 'string') {
      subscriptionId = session.subscription
      // Retrieve full subscription from Stripe
      subscription = await stripe.subscriptions.retrieve(subscriptionId)
    } else if (session.subscription && typeof session.subscription === 'object') {
      // Subscription is already expanded
      subscription = session.subscription as Stripe.Subscription
      subscriptionId = subscription.id
    } else {
      return new Response(
        JSON.stringify({ error: 'No subscription found in session' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map subscription status - no trial period
    const statusMap: Record<string, 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid'> = {
      'active': 'active',
      'past_due': 'past_due',
      'canceled': 'canceled',
      'incomplete': 'incomplete',
      'incomplete_expired': 'incomplete_expired',
      'unpaid': 'unpaid',
    }

    const dbStatus = statusMap[subscription.status] || 'active'

    // Prepare subscription data - no trial fields
    const subscriptionData = {
      user_id: user.id,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: dbStatus,
      price_id: subscription.items.data[0]?.price.id || '',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    }

    // Use service role client to update subscription
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseServiceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseServiceClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    )

    // Check if subscription exists by subscription_id or customer_id
    const { data: existingBySubId } = await supabaseServiceClient
      .from('subscriptions')
      .select('id, stripe_subscription_id, stripe_customer_id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle()

    const { data: existingByCustomer } = await supabaseServiceClient
      .from('subscriptions')
      .select('id, stripe_subscription_id, stripe_customer_id')
      .eq('stripe_customer_id', subscriptionData.stripe_customer_id)
      .maybeSingle()

    // Use upsert with proper conflict handling
    let upsertError = null
    
    if (existingBySubId) {
      // Update by subscription_id
      const { error } = await supabaseServiceClient
        .from('subscriptions')
        .update(subscriptionData)
        .eq('stripe_subscription_id', subscriptionId)
      upsertError = error
    } else if (existingByCustomer) {
      // Update by customer_id (handles unique constraint on customer_id)
      const { error } = await supabaseServiceClient
        .from('subscriptions')
        .update(subscriptionData)
        .eq('stripe_customer_id', subscriptionData.stripe_customer_id)
      upsertError = error
    } else {
      // Insert new subscription
      const { error } = await supabaseServiceClient
        .from('subscriptions')
        .insert(subscriptionData)
      upsertError = error
    }

    if (upsertError) {
      console.error('Upsert error:', {
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint,
        subscriptionData: {
          stripe_subscription_id: subscriptionData.stripe_subscription_id,
          stripe_customer_id: subscriptionData.stripe_customer_id,
          user_id: subscriptionData.user_id,
        },
        existingBySubId: !!existingBySubId,
        existingByCustomer: !!existingByCustomer,
      })
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save subscription', 
          details: upsertError.message,
          code: upsertError.code 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    return new Response(
      JSON.stringify({ 
        success: true,
        subscription: {
          id: subscriptionId,
          status: dbStatus,
          user_id: user.id, // Include user_id for debugging
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : {
      message: 'Unknown error',
      stack: undefined,
      name: 'Error',
    }
    console.error('Validation error:', errorObj)
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        message: errorObj.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

