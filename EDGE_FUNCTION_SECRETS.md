# Edge Function Secrets Guide

This document lists all the environment variables (secrets) that need to be set for your Supabase Edge Functions.

## Required Secrets for All Functions

### 1. `STRIPE_SECRET_KEY`
- **Used by:** All three functions (`stripe-webhook`, `stripe-checkout`, `stripe-portal`)
- **Description:** Your Stripe secret API key
- **Format:** `sk_test_...` (test) or `sk_live_...` (production)
- **Where to find:** Stripe Dashboard → Developers → API keys → Secret key
- **Security:** ⚠️ **NEVER expose this!** Keep it secret.

### 2. `SUPABASE_URL`
- **Used by:** All three functions
- **Description:** Your Supabase project URL
- **Format:** `https://your-project-id.supabase.co`
- **Where to find:** Supabase Dashboard → Project Settings → API → Project URL
- **Note:** Usually auto-available, but good to set explicitly

## Function-Specific Secrets

### `stripe-webhook` Function

#### 3. `STRIPE_WEBHOOK_SECRET`
- **Used by:** `stripe-webhook` only
- **Description:** Webhook signing secret to verify events are from Stripe
- **Format:** `whsec_...`
- **Where to find:** 
  - **Local:** Stripe CLI output when running `stripe listen`
  - **Production:** Stripe Dashboard → Developers → Webhooks → Your endpoint → Signing secret
- **Security:** ⚠️ **NEVER expose this!**

#### 4. `SUPABASE_SERVICE_ROLE_KEY`
- **Used by:** `stripe-webhook` only
- **Description:** Service role key with admin privileges (bypasses RLS)
- **Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find:** Supabase Dashboard → Project Settings → API → Service role key
- **Security:** ⚠️ **NEVER expose this!** Only use in server-side code.

### `stripe-checkout` Function

#### 5. `SUPABASE_ANON_KEY`
- **Used by:** `stripe-checkout` and `stripe-portal`
- **Description:** Anonymous/public key for authenticated requests
- **Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find:** Supabase Dashboard → Project Settings → API → anon/public key
- **Note:** Usually auto-available, but good to set explicitly

#### 6. `STRIPE_PRICE_ID` (Optional)
- **Used by:** `stripe-checkout` only
- **Description:** Default Stripe Price ID for subscriptions
- **Format:** `price_...`
- **Where to find:** Stripe Dashboard → Products → Your Product → Price ID
- **Note:** Can also be passed in the request body, so this is optional

#### 7. `SITE_URL`
- **Used by:** `stripe-checkout` and `stripe-portal`
- **Description:** Your application URL for redirects
- **Format:** 
  - **Local:** `http://localhost:3000`
  - **Production:** `https://yourdomain.com`
- **Used for:** Checkout success/cancel URLs and portal return URL

### `stripe-portal` Function

Uses the same secrets as `stripe-checkout`:
- `STRIPE_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SITE_URL`

---

## How to Set Secrets

### Option 1: Using Supabase CLI (Recommended)

```bash
# Navigate to your project directory
cd petblog

# Set Stripe secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Set Supabase secrets
supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Set optional/configuration secrets
supabase secrets set STRIPE_PRICE_ID=price_...  # Optional
supabase secrets set SITE_URL=http://localhost:3000  # Update for production
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Click **Add new secret** for each variable
4. Enter the secret name and value
5. Click **Save**

### View Current Secrets

```bash
supabase secrets list
```

---

## Complete Checklist

### Required Secrets (Must Set)
- [ ] `STRIPE_SECRET_KEY` - Stripe API secret key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SITE_URL` - Your application URL

### Optional Secrets (Recommended)
- [ ] `STRIPE_PRICE_ID` - Default Stripe price ID (can be passed in request)

---

## Testing Your Secrets

### Test Stripe Secret Key
```bash
stripe api customers list --api-key sk_test_...
```

### Test Webhook Secret
- The webhook function will automatically verify signatures
- Check Supabase function logs if webhooks fail

### Test Supabase Connection
- Check function logs in Supabase Dashboard
- Look for connection errors or authentication issues

---

## Production Checklist

When moving to production:

1. ✅ Switch Stripe Dashboard to **Live mode**
2. ✅ Get your **live keys** (`sk_live_...`)
3. ✅ Create a **production webhook endpoint** in Stripe
4. ✅ Get the **production webhook signing secret**
5. ✅ Update all Supabase secrets with production values
6. ✅ Update `SITE_URL` to your production domain
7. ✅ Test with real payment methods (use small amounts first!)

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit secrets to version control
- Never expose secret keys in client-side code
- Use test keys for development, live keys for production
- Rotate keys if they're ever exposed
- Use environment-specific secrets (dev/staging/prod)

---

## Troubleshooting

### Function fails with "No signature" error
- Check that `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify webhook endpoint URL in Stripe Dashboard

### Function fails with authentication errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (for webhook)
- Verify `SUPABASE_ANON_KEY` is set (for checkout/portal)
- Check that keys match your project

### Checkout session creation fails
- Verify `STRIPE_SECRET_KEY` is correct
- Check that `STRIPE_PRICE_ID` is valid (or passed in request)
- Verify `SITE_URL` is set correctly

### Portal session creation fails
- Verify user has an active subscription
- Check that `STRIPE_SECRET_KEY` is correct
- Verify `SITE_URL` is set correctly

