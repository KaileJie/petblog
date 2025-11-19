# Clone Dev to Pro - Step by Step Guide

## Overview
This guide will help you clone your `pawstories-dev` project to `pawstories-pro` so they are identical.

## Prerequisites
- Supabase CLI installed and authenticated
- Access to both dev and pro projects
- Pro project reference ID: `mqfxxnjudwtqgvxtzbso`

## Steps

### Step 1: Link to Pro Project
```bash
cd petblog
supabase link --project-ref mqfxxnjudwtqgvxtzbso
```

### Step 2: Apply Migrations to Pro
All migrations from dev will be applied to pro:
- `20250108000000_create_blogs_table.sql`
- `20251107141118_create_profiles_table.sql`
- `20251111152509_create_blog_images_bucket.sql`
- `20251112060341_create_subscriptions_table.sql`
- `20251114000000_fix_subscriptions_schema.sql`

```bash
supabase db push
```

### Step 3: Deploy Edge Functions to Pro
Deploy all edge functions:
- `stripe-checkout`
- `stripe-portal`
- `stripe-webhook`
- `test-secret`
- `validate-stripe-session`

```bash
supabase functions deploy stripe-checkout
supabase functions deploy stripe-portal
supabase functions deploy stripe-webhook
supabase functions deploy test-secret
supabase functions deploy validate-stripe-session
```

### Step 4: Configure Storage Buckets
The `blog-images` bucket should be created automatically by migration `20251111152509_create_blog_images_bucket.sql`.

Verify in Supabase Dashboard:
- Go to Storage → Buckets
- Ensure `blog-images` bucket exists with correct policies

### Step 5: Configure Secrets in Pro Project
Set up environment variables/secrets for edge functions:

**Required Secrets:**
1. `STRIPE_SECRET_KEY` - Your Stripe secret key (use production key for pro)
2. `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
3. `SUPABASE_URL` - Auto-configured
4. `SUPABASE_SERVICE_ROLE_KEY` - Auto-configured
5. `SUPABASE_ANON_KEY` - Auto-configured

**Set secrets via CLI:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

**Or via Dashboard:**
- Go to Project Settings → Edge Functions → Secrets
- Add each secret

### Step 6: Configure Edge Function Settings
Some functions need to be publicly accessible (no JWT verification):

**Via Dashboard:**
1. Go to Edge Functions → stripe-webhook
2. Settings → Disable "Verify JWT"
3. Repeat for other functions that need public access

**Via CLI (if supported):**
```bash
supabase functions update stripe-webhook --no-verify-jwt
```

### Step 7: Copy Data (Optional)
If you want to copy data from dev to pro:

```bash
# Dump data from dev
supabase db dump --data-only -f dev_data.sql

# Switch back to pro
supabase link --project-ref mqfxxnjudwtqgvxtzbso

# Restore data to pro
psql <connection_string> < dev_data.sql
```

**Note:** Be careful with production data. Consider if you really want to copy test data to production.

### Step 8: Verify Everything Works
1. Check migrations are applied:
   ```bash
   supabase migration list
   ```

2. Test edge functions:
   - Check function logs in Dashboard
   - Test endpoints manually

3. Verify storage:
   - Try uploading an image
   - Check bucket policies

4. Test authentication:
   - Sign up/login flow
   - Profile creation

## Important Notes

⚠️ **Stripe Keys**: Make sure to use **production Stripe keys** (`sk_live_...`) for the pro project, not test keys.

⚠️ **Webhook URL**: Update Stripe webhook endpoint URL to point to pro project:
- Pro webhook URL: `https://mqfxxnjudwtqgvxtzbso.supabase.co/functions/v1/stripe-webhook`

⚠️ **Environment Variables**: Update your application's `.env` files to point to pro project URLs and keys.

## Rollback Plan
If something goes wrong:
1. Unlink pro: `supabase unlink`
2. Re-link dev: `supabase link --project-ref wqinxqlsmoroqgqpdjfk`
3. Fix issues and retry

