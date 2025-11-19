# 🧹 Cleanup CLI Secrets - Step by Step Guide

## Problem Summary

CLI secrets and Dashboard secrets became out-of-sync, causing Edge Functions to read wrong or outdated environment variables.

## Solution: Dashboard-Only Configuration

This guide will help you:
1. Clean local project (remove CLI secrets references)
2. Reset Dashboard secrets properly
3. Safely redeploy Edge Functions
4. Verify secrets are correctly read

---

## Step 1: Clean Local Project

### 1.1 Remove CLI Secrets Scripts

✅ **Already Done**: `fix-stripe-secret.sh` has been deleted

### 1.2 Update Documentation Files

The following files contain CLI secrets commands and should be **ignored** or **updated**:

- `CHECK_SECRET_ISSUE.md` - Contains CLI commands (can be ignored)
- `VERIFY_SECRET_NOW.md` - Contains CLI commands (can be ignored)
- `STRIPE_SECRET_DIAGNOSIS.md` - Contains CLI commands (can be ignored)
- `COMPLETE_FIX_GUIDE.md` - Contains CLI commands (can be ignored)
- `VERIFY_SECRETS.md` - Contains CLI commands (can be ignored)
- `fix-secrets-issue.md` - Contains CLI commands (can be ignored)
- `SECRETS_VALIDATION_CHECKLIST.md` - Contains CLI commands (can be ignored)
- `FIX_SECRETS.md` - Contains CLI commands (can be ignored)
- `TROUBLESHOOTING.md` - Contains CLI commands (can be ignored)
- `EDGE_FUNCTION_SECRETS.md` - Contains CLI commands (can be ignored)
- `docs/stripe-sub-implementation.md` - Contains CLI commands (can be ignored)

**Action**: These files are documentation only. They won't affect runtime, but you can delete them if you want a clean project.

### 1.3 Check for Supabase Config Files

Check if there are any Supabase config files that might sync secrets:

```bash
# Check for supabase config
ls -la supabase/config.toml

# Check for .branches or other secret files
find supabase -name "*.json" -o -name ".branches" -o -name "secrets*"
```

**Expected**: No config files should exist that manage secrets.

### 1.4 Verify No GitHub Actions

Check for GitHub Actions that might set secrets:

```bash
# Check for GitHub Actions
ls -la .github/workflows/ 2>/dev/null || echo "No .github directory"
```

**Expected**: No GitHub Actions should set secrets via CLI.

---

## Step 2: Reset Dashboard Secrets

### 2.1 Access Dashboard Secrets Page

Go to: https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

### 2.2 Delete All Existing Secrets (Optional but Recommended)

To ensure a clean slate:

1. **Delete each secret one by one:**
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ID`
   - `SITE_URL`

2. **Wait 10 seconds** for deletions to propagate

### 2.3 Re-add Secrets in Dashboard

Add each secret with correct values:

#### `STRIPE_SECRET_KEY`
1. Click "Add new secret"
2. **Name**: `STRIPE_SECRET_KEY` (exact match, uppercase)
3. **Value**: 
   - Get from: https://dashboard.stripe.com/test/apikeys
   - Click "Reveal test key"
   - Copy complete value (starts with `sk_test_`, ~100+ chars)
   - Paste into value field (no spaces before/after)
4. Click "Save"

#### `STRIPE_WEBHOOK_SECRET`
1. Click "Add new secret"
2. **Name**: `STRIPE_WEBHOOK_SECRET`
3. **Value**: 
   - Get from: https://dashboard.stripe.com/test/webhooks
   - Click your webhook endpoint
   - Copy "Signing secret" (starts with `whsec_`)
   - Paste into value field
4. Click "Save"

#### `STRIPE_PRICE_ID`
1. Click "Add new secret"
2. **Name**: `STRIPE_PRICE_ID`
3. **Value**: 
   - Get from: https://dashboard.stripe.com/test/products
   - Click your product
   - Copy "Price ID" (starts with `price_`)
   - Paste into value field
4. Click "Save"

#### `SITE_URL`
1. Click "Add new secret"
2. **Name**: `SITE_URL`
3. **Value**: 
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
4. Click "Save"

### 2.4 Verify Secrets in Dashboard

Confirm all secrets appear in the list:
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `STRIPE_PRICE_ID`
- ✅ `SITE_URL`

**Note**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase and should NOT be manually set.

---

## Step 3: Safely Redeploy Edge Functions

### 3.1 Deploy Functions

Deploy all Edge Functions (this does NOT modify secrets):

```bash
cd /Users/dallylovely/Desktop/Jie/AI/PetBlog/petblog

# Deploy stripe-checkout
supabase functions deploy stripe-checkout

# Deploy stripe-webhook
supabase functions deploy stripe-webhook

# Deploy stripe-portal (if exists)
supabase functions deploy stripe-portal

# Deploy test-secret (for verification)
supabase functions deploy test-secret
```

### 3.2 Wait for Propagation

Wait **10-30 seconds** for deployment to propagate to all regions.

---

## Step 4: Verify Secrets Are Correctly Read

### 4.1 Test with Test Function

The `test-secret` function will show which secrets are available:

1. **Get your Supabase anon key** from Dashboard:
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/settings/api
   - Copy "anon public" key

2. **Call test function**:
   ```bash
   curl -X POST \
     'https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/test-secret' \
     -H 'Authorization: Bearer YOUR_ANON_KEY_HERE' \
     -H 'Content-Type: application/json'
   ```

3. **Expected response**:
   ```json
   {
     "exists": true,
     "length": 107,
     "prefix": "sk_test_51Q...",
     "startsWithSk": true,
     "startsWithSkTest": true,
     "hasWhitespace": false,
     "isValidFormat": true,
     "status": "✅ Valid"
   }
   ```

### 4.2 Check Function Logs

1. **Go to logs**:
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs

2. **Trigger a subscription request** in your app

3. **Look for**:
   ```
   Stripe key check: {
     hasSTRIPE_SECRET_KEY: true,
     keyLength: 107,
     keyPrefix: "sk_test_51Q...",
     startsWithSk: true,
     hasWhitespace: false
   }
   ```

4. **If you see**:
   ```
   Available STRIPE env vars: []
   ```
   This means secrets are NOT being passed to the function. Check Dashboard secrets again.

### 4.3 Test Subscription Flow

1. **Start your app**: `pnpm dev`
2. **Navigate to subscription page**
3. **Click "Subscribe Now"**
4. **Expected**: Redirects to Stripe Checkout page
5. **If error**: Check function logs for details

---

## Step 5: Final Verification Checklist

- [ ] All CLI secrets scripts removed from project
- [ ] All secrets configured in Dashboard (not CLI)
- [ ] Secrets verified in Dashboard list
- [ ] All Edge Functions redeployed
- [ ] Test function shows secrets are loaded
- [ ] Function logs show `hasSTRIPE_SECRET_KEY: true`
- [ ] Subscription flow works correctly

---

## Troubleshooting

### Secret Still Not Found

If `Deno.env.get('STRIPE_SECRET_KEY')` returns `undefined`:

1. **Double-check Dashboard**:
   - Secret name matches exactly: `STRIPE_SECRET_KEY`
   - No spaces before/after name
   - Value is not empty

2. **Re-deploy function**:
   ```bash
   supabase functions deploy stripe-checkout
   ```
   Wait 30 seconds

3. **Check logs**:
   - Look for `Available STRIPE env vars:` output
   - If empty `[]`, Dashboard secret is not being passed to function

### CLI Secrets Still Interfering

If you suspect CLI secrets are still being used:

1. **List CLI secrets** (for reference only):
   ```bash
   supabase secrets list
   ```

2. **DO NOT modify via CLI** - Only use Dashboard

3. **If needed, unset via CLI** (one-time cleanup):
   ```bash
   supabase secrets unset STRIPE_SECRET_KEY
   supabase secrets unset STRIPE_WEBHOOK_SECRET
   supabase secrets unset STRIPE_PRICE_ID
   supabase secrets unset SITE_URL
   ```

4. **Then set via Dashboard** (as per Step 2.3)

---

## Summary

✅ **Dashboard is now the single source of truth for secrets**
✅ **CLI secrets commands are no longer used**
✅ **Edge Functions read secrets only via `Deno.env.get()`**
✅ **Deployment is safe and doesn't modify secrets**

**Going forward**: Always manage secrets through Dashboard only!

