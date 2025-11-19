# 🔧 Fix: Secrets Showing as "Reserved" and Cannot Be Edited

## Problem

When you try to edit secrets in the Dashboard, you see:
> "This is a reserved secret and cannot be changed"

This happens when secrets were set via CLI - Supabase marks them as "reserved" and prevents Dashboard editing.

## Solution: Unset CLI Secrets, Then Set via Dashboard

### Step 1: Identify Which Secrets Are Reserved

**Reserved secrets (should NOT be edited):**
- ✅ `SUPABASE_URL` - Auto-provided by Supabase
- ✅ `SUPABASE_ANON_KEY` - Auto-provided by Supabase  
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided by Supabase
- ✅ `SUPABASE_DB_URL` - Auto-provided by Supabase

**These should NOT be reserved (but might be if set via CLI):**
- ❌ `STRIPE_SECRET_KEY` - Should be editable
- ❌ `STRIPE_WEBHOOK_SECRET` - Should be editable
- ❌ `STRIPE_PRICE_ID` - Should be editable
- ❌ `SITE_URL` - Should be editable

### Step 2: Unset CLI Secrets (One-Time Cleanup)

Use CLI to unset secrets that should be editable but are showing as reserved:

```bash
cd /Users/dallylovely/Desktop/Jie/AI/PetBlog/petblog

# Unset Stripe secrets (these should be editable, not reserved)
supabase secrets unset STRIPE_SECRET_KEY
supabase secrets unset STRIPE_WEBHOOK_SECRET
supabase secrets unset STRIPE_PRICE_ID
supabase secrets unset SITE_URL

# Verify they're removed
supabase secrets list
```

**Important**: 
- DO NOT unset `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `SUPABASE_DB_URL` - these are auto-provided and should remain reserved.

### Step 3: Wait 10-30 Seconds

Wait for the unset operations to propagate through Supabase's system.

### Step 4: Set Secrets via Dashboard

Now go to Dashboard and add the secrets:

1. **Go to Dashboard Secrets**:
   https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

2. **Add each secret** (they should now be editable):

   #### `STRIPE_SECRET_KEY`
   - Click "Add new secret"
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: Get from https://dashboard.stripe.com/test/apikeys
     - Click "Reveal test key"
     - Copy complete value (starts with `sk_test_`, ~100+ chars)
   - Click "Save"

   #### `STRIPE_WEBHOOK_SECRET`
   - Click "Add new secret"
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Get from https://dashboard.stripe.com/test/webhooks
     - Click your webhook endpoint
     - Copy "Signing secret" (starts with `whsec_`)
   - Click "Save"

   #### `STRIPE_PRICE_ID`
   - Click "Add new secret"
   - **Name**: `STRIPE_PRICE_ID`
   - **Value**: Get from https://dashboard.stripe.com/test/products
     - Click your product
     - Copy "Price ID" (starts with `price_`)
   - Click "Save"

   #### `SITE_URL`
   - Click "Add new secret"
   - **Name**: `SITE_URL`
   - **Value**: `http://localhost:3000` (dev) or your production URL
   - Click "Save"

### Step 5: Verify Secrets Are Now Editable

1. **Refresh the Dashboard secrets page**
2. **Try to edit** `STRIPE_SECRET_KEY`
3. **Should now show** edit option (not "reserved" message)

### Step 6: Redeploy Functions

```bash
cd /Users/dallylovely/Desktop/Jie/AI/PetBlog/petblog

supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
supabase functions deploy test-secret
```

### Step 7: Verify Secrets Are Loaded

Check function logs:
- https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs

Should see:
```
Stripe key check: {
  hasSTRIPE_SECRET_KEY: true,
  keyLength: 100+,
  keyPrefix: "sk_test_...",
  startsWithSk: true
}
```

## Why This Happens

- **CLI secrets** → Marked as "reserved" → Cannot edit in Dashboard
- **Dashboard secrets** → Editable → Can edit anytime

By unsetting CLI secrets and setting them via Dashboard, they become editable.

## Going Forward

- ✅ **Always use Dashboard** to manage secrets
- ✅ **Secrets set via Dashboard** are editable
- ❌ **Don't use CLI** `supabase secrets set` anymore

---

**After completing these steps, your secrets will be editable in Dashboard!**

