import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

// Initialize Stripe client lazily
let stripe: Stripe | null = null

function getStripe(): Stripe | null {
  if (!stripe) {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')?.trim()
    
    if (!stripeSecretKey) {
      return null
    }
    
    if (!stripeSecretKey.startsWith('sk_test_') && !stripeSecretKey.startsWith('sk_live_')) {
      return null
    }
    
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })
  }
  return stripe
}

function getWebhookSecret(): string | null {
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')?.trim()
  return secret && secret.startsWith('whsec_') ? secret : null
}

function mapSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' {
  const statusMap: Record<string, 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid'> = {
    'active': 'active',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'incomplete': 'incomplete',
    'incomplete_expired': 'incomplete_expired',
    'unpaid': 'unpaid',
  }
  return statusMap[stripeStatus] || 'active'
}

function prepareSubscriptionData(
  subscription: Stripe.Subscription,
  userId: string
) {
  return {
    user_id: userId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    status: mapSubscriptionStatus(subscription.status),
    price_id: subscription.items.data[0]?.price.id || '',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
  }
}

// Non-blocking event handler - runs in background
async function handleEvent(event: Stripe.Event) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    return
  }

  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
  const stripeInstance = getStripe()
  
  if (!stripeInstance) {
    console.error('Stripe instance not available')
    return
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id

        if (!userId) {
          console.error('No user ID in session metadata')
          return
        }

        const subscriptionId = session.subscription as string | null
        if (!subscriptionId || typeof subscriptionId !== 'string' || subscriptionId.trim() === '') {
          console.warn('No subscription ID in checkout session')
          return
        }

        const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId)
        const subscriptionData = prepareSubscriptionData(subscription, userId)

        // Use UPSERT to handle both insert and update idempotently
        // Conflicts on stripe_subscription_id will trigger update instead of insert
        const { error: upsertError } = await supabaseClient
          .from('subscriptions')
          .upsert(subscriptionData, {
            onConflict: 'stripe_subscription_id',
            ignoreDuplicates: false,
          })

        if (upsertError) {
          console.error('Error upserting subscription:', upsertError)
          // Don't return early - continue to allow webhook to return 200
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id

        if (!userId) {
          console.error('No user ID in subscription metadata')
          return
        }

        const subscriptionData = prepareSubscriptionData(subscription, userId)

        // Use UPSERT to handle both insert and update idempotently
        // Conflicts on stripe_subscription_id will trigger update instead of insert
        const { error: upsertError } = await supabaseClient
          .from('subscriptions')
          .upsert(subscriptionData, {
            onConflict: 'stripe_subscription_id',
            ignoreDuplicates: false,
          })

        if (upsertError) {
          console.error('Error upserting subscription:', upsertError)
          // Don't return early - continue to allow webhook to return 200
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const { data: existingSubscription } = await supabaseClient
          .from('subscriptions')
          .select('id, user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle()

        let userId: string | null = null

        if (existingSubscription) {
          // Subscription exists, use existing user_id
          userId = existingSubscription.user_id
        } else {
          // Subscription doesn't exist yet - try to get user_id from metadata
          // This can happen if customer.subscription.updated arrives before checkout.session.completed
          userId = subscription.metadata?.supabase_user_id || null

          if (!userId) {
            // Try to get user_id from customer metadata as fallback
            try {
              const customer = await stripeInstance.customers.retrieve(subscription.customer as string)
              if (!customer.deleted && customer.metadata?.supabase_user_id) {
                userId = customer.metadata.supabase_user_id
              }
            } catch (customerError: any) {
              console.warn(`Could not retrieve customer for subscription ${subscription.id}:`, customerError.message)
            }
          }

          if (!userId) {
            console.warn(`No subscription found and no user_id in metadata for subscription: ${subscription.id}`)
            return
          }

          console.log(`Creating missing subscription record for ${subscription.id} with user_id ${userId}`)
        }

        // At this point, userId is guaranteed to be non-null
        if (!userId) {
          console.error(`Unexpected: userId is null for subscription ${subscription.id}`)
          return
        }

        const subscriptionData = prepareSubscriptionData(subscription, userId)
        
        // Use upsert to handle both insert and update cases
        const { error: upsertError } = await supabaseClient
          .from('subscriptions')
          .upsert(subscriptionData, {
            onConflict: 'stripe_subscription_id',
            ignoreDuplicates: false,
          })

        if (upsertError) {
          console.error(`Error upserting subscription: ${upsertError.message}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { data: existingSubscription } = await supabaseClient
          .from('subscriptions')
          .select('id, user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle()

        if (!existingSubscription) {
          return
        }

        await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string | null

        if (!subscriptionId || typeof subscriptionId !== 'string' || subscriptionId.trim() === '') {
          return
        }

        const { data: existingSubscription } = await supabaseClient
          .from('subscriptions')
          .select('id, user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle()

        if (!existingSubscription) {
          // Try to get subscription from Stripe and create record if user_id is available
          try {
            const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId)
            const userId = subscription.metadata?.supabase_user_id || null

            if (!userId) {
              // Try customer metadata as fallback
              const customer = await stripeInstance.customers.retrieve(subscription.customer as string)
              if (!customer.deleted && customer.metadata?.supabase_user_id) {
                const fallbackUserId = customer.metadata.supabase_user_id
                // Create subscription record with past_due status
                const subscriptionData = prepareSubscriptionData(subscription, fallbackUserId)
                subscriptionData.status = 'past_due'
                
                await supabaseClient
                  .from('subscriptions')
                  .upsert(subscriptionData, {
                    onConflict: 'stripe_subscription_id',
                    ignoreDuplicates: false,
                  })
                return
              }
            }

            if (userId) {
              // Create subscription record with past_due status
              const subscriptionData = prepareSubscriptionData(subscription, userId)
              subscriptionData.status = 'past_due'
              
              await supabaseClient
                .from('subscriptions')
                .upsert(subscriptionData, {
                  onConflict: 'stripe_subscription_id',
                  ignoreDuplicates: false,
                })
            }
          } catch (stripeError: any) {
            console.warn(`Could not process payment_failed for subscription ${subscriptionId}:`, stripeError.message)
          }
          return
        }

        await supabaseClient
          .from('subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('stripe_subscription_id', subscriptionId)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string | null

        if (!subscriptionId || typeof subscriptionId !== 'string' || subscriptionId.trim() === '') {
          return
        }

        const { data: existingSubscription } = await supabaseClient
          .from('subscriptions')
          .select('id, user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle()

        let userId: string | null = null

        if (existingSubscription) {
          userId = existingSubscription.user_id
        } else {
          // Try to get subscription from Stripe and extract user_id from metadata
          try {
            const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId)
            userId = subscription.metadata?.supabase_user_id || null

            if (!userId) {
              // Try customer metadata as fallback
              const customer = await stripeInstance.customers.retrieve(subscription.customer as string)
              if (!customer.deleted && customer.metadata?.supabase_user_id) {
                userId = customer.metadata.supabase_user_id
              }
            }

            if (!userId) {
              console.warn(`No subscription found and no user_id in metadata for invoice subscription: ${subscriptionId}`)
              return
            }

            console.log(`Creating missing subscription record for invoice ${subscriptionId} with user_id ${userId}`)
          } catch (stripeError: any) {
            console.error(`Error retrieving subscription ${subscriptionId}:`, stripeError.message)
            return
          }
        }

        // At this point, userId should be non-null, but check to be safe
        if (!userId) {
          console.error(`Unexpected: userId is null for invoice subscription ${subscriptionId}`)
          return
        }

        const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId)
        const subscriptionData = prepareSubscriptionData(subscription, userId)

        // Use upsert to handle both insert and update cases
        const { error: upsertError } = await supabaseClient
          .from('subscriptions')
          .upsert(subscriptionData, {
            onConflict: 'stripe_subscription_id',
            ignoreDuplicates: false,
          })

        if (upsertError) {
          console.error(`Error upserting subscription: ${upsertError.message}`)
        }
        break
      }

      default:
        // Unhandled event type
        break
    }
  } catch (error: any) {
    console.error('Error in handleEvent:', error.message)
  }
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'stripe-signature, content-type',
        },
      })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'No signature' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const webhookSecret = getWebhookSecret()
    if (!webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const stripeInstance = getStripe()
    if (!stripeInstance) {
      return new Response(
        JSON.stringify({ error: 'Stripe secret key not configured' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    let event: Stripe.Event

    try {
      const rawBody = await new Response(req.body).text()
      
      event = await stripeInstance.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret
      )
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed', message: err.message }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // NON-BLOCKING: Start processing in background, return immediately
    handleEvent(event).catch((error) => {
      console.error('Background event processing error:', error)
    })

    // Return response immediately (< 100ms)
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Unexpected error in stripe-webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error in stripe-webhook' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
