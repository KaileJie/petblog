# Stripe Subscription Integration Implementation Guide

## Overview

This document provides a step-by-step guide to implement a complete subscription system in the PetBlog Next.js application using Stripe and Supabase. The integration will enable premium access control for the Dashboard features.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema Updates](#database-schema-updates)
4. [Stripe Setup](#stripe-setup)
5. [Environment Variables](#environment-variables)
6. [Supabase Edge Function for Checkout](#supabase-edge-function-for-checkout)
7. [Webhook Handler (Supabase Edge Function)](#webhook-handler-supabase-edge-function)
8. [Next.js Implementation](#nextjs-implementation)
9. [Access Control & Middleware](#access-control--middleware)
10. [Testing](#testing)
11. [Deployment](#deployment)

---

## Prerequisites

- Stripe account (test mode for development)
- Supabase project with existing auth setup
- Next.js 16+ application with App Router
- Node.js 18+ installed

---

## Architecture Overview

```
User Flow:
1. User signs up → Supabase Auth
2. User tries to access /dashboard → Redirected to /subscribe
3. User clicks "Subscribe" → Stripe Checkout Session created (Edge Function) with 3-day trial
4. User completes checkout → Stripe webhook → Supabase creates/updates subscription record
5. User redirected directly to /dashboard
6. User can now access all dashboard features
7. After 3 days, Stripe charges the customer
8. User can manage subscription via Stripe Customer Portal
```

### Components Involved

- **Supabase Edge Function**: Creates Stripe Checkout sessions and Customer Portal sessions
- **Stripe Webhook**: Creates/updates subscription records in Supabase
- **Next.js Middleware**: Protects dashboard routes
- **Database Migration**: Creates separate subscriptions table

---

## Database Schema Updates

### Migration: Create Subscriptions Table

**File**: `supabase/migrations/YYYYMMDDHHmmss_create_subscriptions_table.sql`

```sql
-- Create subscriptions table
create table if not exists public.subscriptions (
  id uuid generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id text unique not null,
  stripe_subscription_id text unique not null,
  status text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  price_id text not null,
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  cancel_at_period_end boolean default false,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.subscriptions is 'Stripe subscription records linked to user profiles';

-- Enable Row Level Security
alter table public.subscriptions enable row level security;

-- Create policy: Users can view their own subscription
create policy "Users can view own subscription"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Create policy: Service role can manage all subscriptions (for webhooks)
create policy "Service role can manage subscriptions"
  on public.subscriptions
  for all
  to service_role
  using (true)
  with check (true);

-- Create indexes for faster queries
create index if not exists idx_subscriptions_user_id 
on public.subscriptions(user_id);

create index if not exists idx_subscriptions_stripe_customer_id 
on public.subscriptions(stripe_customer_id);

create index if not exists idx_subscriptions_stripe_subscription_id 
on public.subscriptions(stripe_subscription_id);

create index if not exists idx_subscriptions_status 
on public.subscriptions(status);

-- Create function to update updated_at timestamp
create or replace function public.handle_subscription_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create trigger to update updated_at on subscription update
create trigger on_subscription_updated
  before update on public.subscriptions
  for each row
  execute function public.handle_subscription_updated_at();
```

### Update TypeScript Types

**File**: `types/subscription.ts` (NEW FILE)

```typescript
export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  price_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionInsert = {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  price_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string | null;
  trial_start?: string | null;
  trial_end?: string | null;
};

export type SubscriptionUpdate = {
  status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string | null;
  trial_start?: string | null;
  trial_end?: string | null;
};
```

**File**: `types/index.ts` (Update to export subscription types)

```typescript
export * from './blog';
export * from './profile';
export * from './subscription'; // Add this line
```

---

## Stripe Setup

### Step 1: Create Products and Prices in Stripe Dashboard

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add Product**
3. Create a product (e.g., "PetBlog Premium")
4. Add a recurring price:
   - **Price**: $5.99/month
   - **Billing period**: Monthly
   - **Currency**: USD
   - **Trial period**: 3 days (optional - can be set in checkout session)
5. Copy the **Price ID** (starts with `price_...`)

**Note**: Create separate prices for different plans if needed (e.g., monthly vs yearly).

### Step 2: Configure Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. For local development:
   - Use Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`
4. For production:
   - Endpoint URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
5. Copy the **Webhook Signing Secret** (starts with `whsec_...`)

---

## Stripe Keys & Credentials Guide

This section explains all the Stripe keys and credentials you need, where to find them, and where to use them.

### Overview: What Keys Do You Need?

You need **4 different Stripe credentials**:

1. **Publishable Key** (`pk_test_...` or `pk_live_...`) - Used in Next.js frontend
2. **Secret Key** (`sk_test_...` or `sk_live_...`) - Used in Supabase Edge Functions
3. **Webhook Signing Secret** (`whsec_...`) - Used to verify webhook events
4. **Price ID** (`price_...`) - Identifies your subscription plan

---

### Step-by-Step: Finding Your Stripe Keys

#### 1. Get Your API Keys (Publishable & Secret)

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in top right - should say "Test mode")
3. Go to **Developers** → **API keys** (in the left sidebar)
4. You'll see two keys:

   **Publishable key** (starts with `pk_test_`):
   - This is safe to expose in your frontend code
   - Copy this value
   - Example: `pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890...`

   **Secret key** (starts with `sk_test_`):
   - ⚠️ **NEVER expose this in frontend code!**
   - Click "Reveal test key" to see it
   - Copy this value
   - Example: `sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890...`

**For Production:**
- Switch to **Live mode** (toggle in top right)
- Repeat the same steps to get your **live keys** (`pk_live_...` and `sk_live_...`)
- Use live keys only in production environment

---

#### 2. Get Your Price ID

1. In Stripe Dashboard, go to **Products** (in the left sidebar)
2. Click on your product (e.g., "PetBlog Premium")
3. Under the product, you'll see your price(s)
4. Click on the price you want to use
5. You'll see the **Price ID** at the top (starts with `price_`)
   - Example: `price_1234567890abcdef`
6. Copy this value

**Alternative way:**
- Go to **Products** → Click your product → The Price ID is shown in the price list
- It's also visible in the URL when viewing a price

---

#### 3. Get Your Webhook Signing Secret

**For Local Development (using Stripe CLI):**

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Authenticate: `stripe login`
3. Start listening: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`
4. The CLI will output a webhook signing secret (starts with `whsec_`)
   - Example: `whsec_1234567890abcdef...`
5. Copy this value

**For Production:**

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click on your webhook endpoint (or create one if you haven't)
3. Click on the endpoint to view details
4. In the "Signing secret" section, click **Reveal** or **Click to reveal**
5. Copy the signing secret (starts with `whsec_`)
   - Example: `whsec_1234567890abcdef...`

**Important:** Each webhook endpoint has its own signing secret. Make sure you use the correct one for your environment.

---

### Where to Use Each Key

#### 1. Publishable Key (`pk_test_...` or `pk_live_...`)

**Where:** Next.js frontend (`.env.local`)

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz...
```

**Used for:**
- Client-side Stripe operations (if you add any in the future)
- Currently not directly used in our implementation, but good to have

**Security:** ✅ Safe to expose in frontend code (it's public)

---

#### 2. Secret Key (`sk_test_...` or `sk_live_...`)

**Where:** Supabase Edge Functions (Supabase Secrets)

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz...
```

**Used for:**
- Creating Stripe Checkout sessions (`stripe-checkout` function)
- Creating Customer Portal sessions (`stripe-portal` function)
- Retrieving subscription details in webhook handler

**Security:** ⚠️ **NEVER expose this!** Only use in server-side code (Edge Functions)

---

#### 3. Webhook Signing Secret (`whsec_...`)

**Where:** Supabase Edge Functions (Supabase Secrets)

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

**Used for:**
- Verifying webhook events are actually from Stripe (`stripe-webhook` function)
- Prevents unauthorized webhook calls

**Security:** ⚠️ **NEVER expose this!** Only use in server-side code

---

#### 4. Price ID (`price_...`)

**Where:** Next.js frontend (`.env.local`)

```env
NEXT_PUBLIC_STRIPE_PRICE_ID=price_1234567890abcdef
```

**Used for:**
- Identifying which subscription plan to create
- Passed to checkout session creation

**Security:** ✅ Safe to expose (it's just an identifier)

---

## Environment Variables Setup

### Supabase Secrets (Server-Side)

Add these secrets to your Supabase project. These are used by Edge Functions and are **never exposed to the client**.

**Option 1: Via Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Add each secret:
   - `STRIPE_SECRET_KEY` = `sk_test_...` (your secret key)
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (your webhook signing secret)
   - `STRIPE_PRICE_ID` = `price_...` (your price ID - optional, can also be passed in request)
   - `SITE_URL` = `http://localhost:3000` (for local) or `https://yourdomain.com` (for production)

**Option 2: Via Supabase CLI**
```bash
# Set Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz...

# Set Webhook Signing Secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...

# Set Price ID (optional - can also be passed in request body)
supabase secrets set STRIPE_PRICE_ID=price_1234567890abcdef

# Set Site URL
supabase secrets set SITE_URL=http://localhost:3000
```

**To view your secrets:**
```bash
supabase secrets list
```

---

### Next.js Environment Variables (Client-Side)

**File**: `.env.local` (create this file in your `petblog` directory if it doesn't exist)

```env
# Stripe Publishable Key (Public - Safe to expose)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz...

# Stripe Price ID (Public - Safe to expose)
NEXT_PUBLIC_STRIPE_PRICE_ID=price_1234567890abcdef

# Supabase (Already exists in your project)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJ...
```

**Important Notes:**
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Never put secret keys (`sk_...`) in `.env.local`!
- Restart your Next.js dev server after adding/changing `.env.local`

---

### Quick Reference: Key Locations

| Key Type | Starts With | Where to Find | Where to Use | Security |
|----------|-------------|---------------|--------------|----------|
| **Publishable Key** | `pk_test_` or `pk_live_` | Stripe Dashboard → Developers → API keys | `.env.local` as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Safe to expose |
| **Secret Key** | `sk_test_` or `sk_live_` | Stripe Dashboard → Developers → API keys | Supabase Secrets as `STRIPE_SECRET_KEY` | ⚠️ Never expose |
| **Webhook Secret** | `whsec_` | Stripe Dashboard → Developers → Webhooks OR Stripe CLI | Supabase Secrets as `STRIPE_WEBHOOK_SECRET` | ⚠️ Never expose |
| **Price ID** | `price_` | Stripe Dashboard → Products → Your Product → Price | `.env.local` as `NEXT_PUBLIC_STRIPE_PRICE_ID` | ✅ Safe to expose |

---

### Testing Your Keys

**Test your Secret Key:**
```bash
# Using Stripe CLI
stripe api customers list --api-key sk_test_...
```

**Test your Webhook Secret:**
- The webhook handler will verify signatures automatically
- Check Supabase function logs if webhooks fail

**Test your Price ID:**
```bash
# Using Stripe CLI
stripe prices retrieve price_... --api-key sk_test_...
```

---

### Production Checklist

When moving to production:

1. ✅ Switch Stripe Dashboard to **Live mode**
2. ✅ Get your **live keys** (`pk_live_...` and `sk_live_...`)
3. ✅ Create a **production webhook endpoint** in Stripe
4. ✅ Get the **production webhook signing secret**
5. ✅ Update Supabase secrets with live keys
6. ✅ Update `.env.local` (or production env vars) with live publishable key
7. ✅ Update `SITE_URL` secret to your production domain
8. ✅ Test with real payment methods (use small amounts first!)

---

## Supabase Edge Function for Checkout

### Create Checkout Session Function

**File**: `supabase/functions/stripe-checkout/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

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

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get price ID from request body or use default
    const { priceId } = await req.json()
    const finalPriceId = priceId || Deno.env.get('STRIPE_PRICE_ID') || ''

    if (!finalPriceId) {
      return new Response(
        JSON.stringify({ error: 'Price ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already has a subscription with a customer ID
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    // Create or retrieve Stripe customer
    let customerId = existingSubscription?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
    }

    // Create Stripe Checkout Session with 3-day trial
    const session = await stripe.checkout.sessions.create({
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
        trial_period_days: 3,
        metadata: {
          supabase_user_id: user.id,
        },
      },
      success_url: `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/subscribe`,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Deploy Edge Function

```bash
# Deploy the checkout function
supabase functions deploy stripe-checkout

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_PRICE_ID=price_...
supabase secrets set SITE_URL=http://localhost:3000  # Update for production
```

---

## Webhook Handler (Supabase Edge Function)

### Create Webhook Function

**File**: `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  let event: Stripe.Event

  try {
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id

        if (!userId) {
          console.error('No user ID in session metadata')
          break
        }

        // Get subscription details
        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Determine subscription status
        let status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' = 'active'
        if (subscription.status === 'trialing') {
          status = 'trialing'
        } else if (subscription.status === 'active') {
          status = 'active'
        } else if (subscription.status === 'past_due') {
          status = 'past_due'
        } else if (subscription.status === 'canceled') {
          status = 'canceled'
        } else if (subscription.status === 'incomplete') {
          status = 'incomplete'
        } else if (subscription.status === 'incomplete_expired') {
          status = 'incomplete_expired'
        } else if (subscription.status === 'unpaid') {
          status = 'unpaid'
        }

        // Create or update subscription record
        const subscriptionData = {
          user_id: userId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscriptionId,
          status: status,
          price_id: subscription.items.data[0]?.price.id || '',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        }

        // Check if subscription already exists
        const { data: existing } = await supabaseClient
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (existing) {
          // Update existing subscription
          await supabaseClient
            .from('subscriptions')
            .update(subscriptionData)
            .eq('stripe_subscription_id', subscriptionId)
        } else {
          // Create new subscription
          await supabaseClient
            .from('subscriptions')
            .insert(subscriptionData)
        }

        console.log(`Subscription ${existing ? 'updated' : 'created'} for user: ${userId}, status: ${status}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find subscription by subscription ID
        const { data: existingSubscription } = await supabaseClient
          .from('subscriptions')
          .select('id, user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (!existingSubscription) {
          console.error(`No subscription found for subscription ID: ${subscription.id}`)
          break
        }

        // Determine subscription status
        let status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' = 'active'
        if (subscription.status === 'trialing') {
          status = 'trialing'
        } else if (subscription.status === 'active') {
          status = 'active'
        } else if (subscription.status === 'past_due') {
          status = 'past_due'
        } else if (subscription.status === 'canceled') {
          status = 'canceled'
        } else if (subscription.status === 'incomplete') {
          status = 'incomplete'
        } else if (subscription.status === 'incomplete_expired') {
          status = 'incomplete_expired'
        } else if (subscription.status === 'unpaid') {
          status = 'unpaid'
        }

        // Update subscription record
        await supabaseClient
          .from('subscriptions')
          .update({
            status: status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end || false,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`Subscription updated for user: ${existingSubscription.user_id}, status: ${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Find subscription by subscription ID
        const { data: existingSubscription } = await supabaseClient
          .from('subscriptions')
          .select('id, user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (!existingSubscription) {
          console.error(`No subscription found for subscription ID: ${subscription.id}`)
          break
        }

        // Update subscription to canceled
        await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`Subscription canceled for user: ${existingSubscription.user_id}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (!subscriptionId) {
          console.error('No subscription ID in invoice')
          break
        }

        // Find subscription by subscription ID
        const { data: existingSubscription } = await supabaseClient
          .from('subscriptions')
          .select('id, user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (!existingSubscription) {
          console.error(`No subscription found for subscription ID: ${subscriptionId}`)
          break
        }

        // Update to past_due
        await supabaseClient
          .from('subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('stripe_subscription_id', subscriptionId)

        console.log(`Payment failed for user: ${existingSubscription.user_id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Deploy Webhook Function

```bash
# Deploy the webhook function
supabase functions deploy stripe-webhook

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Next.js Implementation

### Step 1: Install Stripe Dependencies

```bash
npm install stripe @stripe/stripe-js
npm install -D @types/stripe
```

### Step 2: Create Subscribe Page

**File**: `app/subscribe/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { SiteHeader } from '@/components/header'
import { Loader2 } from 'lucide-react'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
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

      // Call Supabase Edge Function to create checkout session
      const { data, error: functionError } = await supabase.functions.invoke('stripe-checkout', {
        body: { priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID },
      })

      if (functionError) {
        throw functionError
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create checkout session')
      setLoading(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Subscribe to PetBlog Premium</CardTitle>
              <CardDescription>
                Unlock full access to create and manage your blog posts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">What's included:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Create unlimited blog posts</li>
                  <li>Edit and delete your posts</li>
                  <li>Access to dashboard features</li>
                  <li>Priority support</li>
                </ul>
              </div>

              <div className="pt-4">
                <div className="mb-2">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-2">
                    3-Day Free Trial
                  </span>
                </div>
                <p className="text-2xl font-bold mb-1">$5.99/month</p>
                <p className="text-sm text-muted-foreground mb-4">After 3-day free trial</p>
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
```

### Step 3: Update Dashboard Page to Handle Checkout Success

The dashboard page will handle the redirect from Stripe Checkout. We'll add a check for the session_id query parameter and verify the subscription.

**File**: `app/dashboard/page.tsx` (Update existing or create new)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [verifying, setVerifying] = useState(!!sessionId)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const verifySubscription = async () => {
      if (!sessionId) {
        setVerifying(false)
        return
      }

      try {
        const supabase = createClient()
        
        // Poll for subscription status update (webhook may take a moment)
        let attempts = 0
        const maxAttempts = 15

        const checkSubscription = async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            setVerifying(false)
            return
          }

          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', user.id)
            .in('status', ['active', 'trialing'])
            .single()

          if (subscription) {
            setVerified(true)
            setVerifying(false)
            // Remove session_id from URL after verification
            window.history.replaceState({}, '', '/dashboard')
          } else if (attempts < maxAttempts) {
            attempts++
            setTimeout(checkSubscription, 1000)
          } else {
            setVerifying(false)
          }
        }

        checkSubscription()
      } catch (err) {
        console.error('Verification error:', err)
        setVerifying(false)
      }
    }

    verifySubscription()
  }, [sessionId])

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <CardTitle className="text-center">Setting up your subscription...</CardTitle>
            <CardDescription className="text-center">
              This will only take a moment
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
            <CardTitle className="text-center">Welcome to PetBlog Premium!</CardTitle>
            <CardDescription className="text-center">
              Your subscription is active. Enjoy all premium features!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Regular dashboard content
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {/* Your dashboard content here */}
    </div>
  )
}
```

### Step 4: Update Dashboard Layout with Subscription Check

**File**: `app/dashboard/layout.tsx`

```typescript
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check subscription status
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .single()

  if (!subscription) {
    redirect("/subscribe")
  }

  return <DashboardSidebar>{children}</DashboardSidebar>
}
```

### Step 5: Update Protected Page

**File**: `app/protected/page.tsx`

```typescript
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  // Check subscription status
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single()

    if (!subscription) {
      redirect('/subscribe')
    }
  }

  return (
    <div className="flex h-svh w-full items-center justify-center gap-2">
      <p>
        Hello <span>{data.claims.email}</span>
      </p>
      <LogoutButton />
    </div>
  )
}
```

---

## Access Control & Middleware

### Update Middleware

**File**: `lib/supabase/middleware.ts`

Add subscription check for dashboard routes:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/blogs', '/auth/login', '/auth/sign-up', '/subscribe', '/success']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )

  // Redirect unauthenticated users (except for public routes)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Check subscription for dashboard and protected routes
  if (user && (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/protected'))) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', authUser.id)
        .in('status', ['active', 'trialing'])
        .single()

      if (!subscription) {
        const url = request.nextUrl.clone()
        url.pathname = '/subscribe'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
```

---

## Testing

### Local Development Setup

1. **Start Supabase locally**:
   ```bash
   supabase start
   ```

2. **Deploy Edge Functions locally**:
   ```bash
   supabase functions serve stripe-checkout --no-verify-jwt
   supabase functions serve stripe-webhook --no-verify-jwt
   ```

3. **Set up Stripe CLI for webhooks**:
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```

4. **Use Stripe test cards**:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date and CVC

### Test Scenarios

1. ✅ Unauthenticated user tries to access `/dashboard` → Redirected to `/auth/login`
2. ✅ Authenticated user without subscription tries `/dashboard` → Redirected to `/subscribe`
3. ✅ User completes checkout → Webhook creates subscription → Redirected to `/dashboard`
4. ✅ User in trial period (`trialing` status) → Can access dashboard
5. ✅ After 3 days, Stripe charges customer → Status changes to `active`
6. ✅ User cancels subscription → Webhook updates status → Access revoked at period end
7. ✅ Payment fails → Status updated to `past_due` → Access revoked
8. ✅ User manages subscription via Customer Portal → Can update payment method, cancel, etc.

---

## Deployment

### Production Checklist

1. **Update Environment Variables**:
   - Set `SITE_URL` in Supabase secrets to your production URL
   - Use production Stripe keys
   - Update webhook endpoint in Stripe Dashboard

2. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy stripe-checkout
   supabase functions deploy stripe-webhook
   ```

3. **Run Database Migration**:
   ```bash
   supabase db push
   ```

4. **Configure Stripe Webhook**:
   - Add production endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Copy webhook signing secret and update Supabase secrets

5. **Test Production Flow**:
   - Test with real Stripe test cards
   - Verify webhook events are received
   - Confirm subscription status updates correctly

---

## Additional Features

### Stripe Customer Portal

Allow users to manage subscriptions, update payment methods, and cancel subscriptions.

#### Step 1: Create Customer Portal Edge Function

**File**: `supabase/functions/stripe-portal/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

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

    // Get user's subscription to find customer ID
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'No subscription found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/dashboard/account`,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

#### Step 2: Deploy Portal Function

```bash
supabase functions deploy stripe-portal
```

#### Step 3: Add Portal Link to Account Page

**File**: `app/dashboard/account/page.tsx` (Update existing)

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CreditCard } from 'lucide-react'

export default function AccountPage() {
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
    } catch (err: any) {
      console.error('Error opening portal:', err)
      alert(err.message || 'Failed to open subscription portal')
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Manage your subscription, payment methods, and billing history
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**:
   - Check webhook endpoint URL in Stripe Dashboard
   - Verify webhook secret is correct
   - Check Supabase function logs
   - For local testing, ensure Stripe CLI is forwarding events

2. **Subscription status not updating**:
   - Verify webhook events are being processed
   - Check database migration ran successfully
   - Review Edge Function logs
   - Ensure RLS policies allow service_role to insert/update subscriptions

3. **Checkout session creation fails**:
   - Verify Stripe keys are correct
   - Check Edge Function logs
   - Ensure user is authenticated
   - Verify Price ID is correct

4. **Trial period not working**:
   - Check that `trial_period_days: 3` is set in checkout session
   - Verify subscription shows `trialing` status in Stripe Dashboard
   - Check that webhook handles `trialing` status correctly

5. **Customer Portal not accessible**:
   - Verify user has an active subscription
   - Check that `stripe_customer_id` exists in subscriptions table
   - Ensure Edge Function has correct Stripe secret key

---

## Security Considerations

1. ✅ Always verify webhook signatures using Stripe webhook secret
2. ✅ Use Supabase RLS policies to protect user data
3. ✅ Never expose Stripe secret keys in client code
4. ✅ Validate user authentication before creating checkout sessions
5. ✅ Use environment variables for all sensitive data
6. ✅ Service role key only used in Edge Functions (never in client)
7. ✅ Users can only access their own subscription records via RLS
8. ✅ Customer Portal sessions are user-specific and time-limited

---

## Next Steps

After implementation:

1. Test all user flows thoroughly
2. Set up monitoring for webhook events
3. Add error handling and user notifications
4. Consider adding subscription management UI
5. Set up email notifications for subscription events

---

## Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Last Updated**: [Current Date]
**Version**: 1.0.0

