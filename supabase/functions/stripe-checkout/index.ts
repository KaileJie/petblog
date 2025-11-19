import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

// Initialize Stripe - will be validated later
let stripe: Stripe | null = null

function getStripe(): Stripe | null {
  if (!stripe) {
    let secretKey = Deno.env.get('STRIPE_SECRET_KEY')
    
    if (secretKey) {
      secretKey = secretKey.trim()
    }
    
    if (!secretKey) {
      return null
    }
    
    // Validate key format
    if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
      return null
    }
    
    if (secretKey.length < 50) {
      return null
    }
    
    stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
      typescript: true,
    })
  }
  return stripe
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Top-level try-catch to ensure we always return a Response
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Supabase credentials' }),
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

    // Get user profile, create if doesn't exist
    let { data: profile } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()
    
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      // Profile doesn't exist, try to create it
      console.log('Profile not found, attempting to create...')
      const { data: newProfile, error: createError } = await supabaseClient
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
        })
        .select('email')
        .single()

      if (createError || !newProfile) {
        console.error('Failed to create profile:', createError)
        return new Response(
          JSON.stringify({ 
            error: 'Profile not found and could not be created',
            details: createError?.message || 'Unknown error'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      profile = newProfile
      console.log('Profile created successfully')
    }

    // Get price ID from request body or use default
    let requestBody: { priceId?: string } = {}
    try {
      const contentType = req.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        requestBody = await req.json()
      }
    } catch {
      // Continue with empty body, will use env var
    }

    const finalPriceId = requestBody.priceId || Deno.env.get('STRIPE_PRICE_ID') || ''

    if (!finalPriceId) {
      return new Response(
        JSON.stringify({ error: 'Price ID is required. Please configure STRIPE_PRICE_ID.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Stripe client
    const stripeInstance = getStripe()
    if (!stripeInstance) {
      return new Response(
        JSON.stringify({ 
          error: 'Stripe Secret Key is not configured. Please configure STRIPE_SECRET_KEY in Supabase Dashboard.',
          code: 'STRIPE_SECRET_KEY_MISSING'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already has a subscription with a customer ID
    const { data: existingSubscription, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({ error: 'Failed to check existing subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create or retrieve Stripe customer
    let customerId = existingSubscription?.stripe_customer_id

    if (!customerId) {
      try {
        const customer = await stripeInstance.customers.create({
          email: profile.email,
          metadata: {
            supabase_user_id: user.id,
          },
        })
        customerId = customer.id
      } catch (stripeError: unknown) {
        const errorMessage = stripeError instanceof Error ? stripeError.message : 'Failed to create customer'
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Create Stripe Checkout Session - $5.99/month, no trial period
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000'
    
    try {
      const session = await stripeInstance.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: finalPriceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
          },
        },
        success_url: `${siteUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/subscribe`,
        metadata: {
          supabase_user_id: user.id,
        },
      })

      return new Response(
        JSON.stringify({ sessionId: session.id, url: session.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (stripeError: unknown) {
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Failed to create checkout session'
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error: unknown) {
    // Top-level catch for any unhandled errors
    console.error('Unexpected error in stripe-checkout:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error in stripe-checkout' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
