# 🎯 Dashboard-Only Secrets Configuration Guide

## ⚠️ CRITICAL: Stop Using CLI Secrets

**This project uses Dashboard-only secrets management. CLI secrets commands are NOT used and will cause inconsistencies.**

## ✅ Current Configuration Strategy

1. **Secrets are defined ONLY in Supabase Dashboard**
   - Location: Dashboard → Project → Edge Functions → Variables (Secrets)
   - URL: https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

2. **Edge Functions read secrets ONLY via `Deno.env.get()`**
   - No iteration over `Deno.env`
   - No CLI fallback logic
   - No `.env` file merging

3. **Deployment is done via Dashboard or CLI `functions deploy`**
   - CLI `functions deploy` is safe (it doesn't modify secrets)
   - Only Dashboard manages secrets

## 📋 Required Secrets

Configure these secrets in the Dashboard:

### 1. `STRIPE_SECRET_KEY`
- **Format**: `sk_test_...` (test) or `sk_live_...` (production)
- **Length**: ~100+ characters
- **Source**: Stripe Dashboard → Developers → API keys → Secret key
- **URL**: https://dashboard.stripe.com/test/apikeys

### 2. `STRIPE_WEBHOOK_SECRET`
- **Format**: `whsec_...`
- **Source**: Stripe Dashboard → Developers → Webhooks → Your endpoint → Signing secret
- **URL**: https://dashboard.stripe.com/test/webhooks

### 3. `STRIPE_PRICE_ID`
- **Format**: `price_...`
- **Source**: Stripe Dashboard → Products → Your product → Price ID
- **URL**: https://dashboard.stripe.com/test/products

### 4. `SITE_URL`
- **Format**: `http://localhost:3000` (dev) or `https://yourdomain.com` (production)
- **Purpose**: Used for redirect URLs in Stripe Checkout

## 🚀 How to Set Secrets in Dashboard

1. **Navigate to Secrets Page**
   - Go to: https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

2. **Add or Edit Secret**
   - Click "Add new secret" or edit existing secret
   - **Name**: Must match exactly (case-sensitive)
   - **Value**: Paste complete value (no spaces before/after)
   - Click "Save"

3. **Verify Secret**
   - Confirm secret appears in the list
   - Check name matches exactly (no extra spaces)

4. **Deploy Function** (if needed)
   ```bash
   supabase functions deploy stripe-checkout
   supabase functions deploy stripe-webhook
   ```

## 🔍 Verification

### Test Secret Loading

Use the test function to verify secrets are loaded:

```bash
# Deploy test function (if not already deployed)
supabase functions deploy test-secret

# Call it (requires auth header)
curl -X POST \
  'https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/test-secret' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Check Function Logs

1. Go to: https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs
2. Trigger a subscription request
3. Look for:
   ```
   Stripe key check: {
     hasSTRIPE_SECRET_KEY: true,
     keyLength: 100+,
     keyPrefix: "sk_test_...",
     startsWithSk: true
   }
   ```

## ❌ What NOT to Do

1. **DO NOT use CLI secrets commands:**
   ```bash
   # ❌ DON'T DO THIS
   supabase secrets set STRIPE_SECRET_KEY=...
   supabase secrets unset STRIPE_SECRET_KEY
   supabase secrets list
   ```

2. **DO NOT create scripts that set secrets via CLI**

3. **DO NOT rely on CLI secrets for deployment**

## 🔧 Troubleshooting

### Secret Not Found

If `Deno.env.get('STRIPE_SECRET_KEY')` returns `undefined`:

1. **Check Dashboard**
   - Verify secret exists: https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets
   - Check name matches exactly (case-sensitive, no spaces)

2. **Re-deploy Function**
   ```bash
   supabase functions deploy stripe-checkout
   ```
   - Wait 10-30 seconds for deployment to propagate

3. **Check Function Logs**
   - Look for `Available STRIPE env vars:` in logs
   - If empty array `[]`, secret is not being passed to function

### Secret Value Issues

- **Empty value**: Secret exists but value is empty → Set value in Dashboard
- **Wrong format**: Value doesn't start with `sk_test_` or `sk_live_` → Check Stripe Dashboard
- **Truncated**: Value too short → Copy complete value from Stripe Dashboard

## 📝 Cleanup Checklist

- [ ] All secrets configured in Dashboard (not CLI)
- [ ] No CLI secrets scripts in project
- [ ] Edge Functions use only `Deno.env.get()`
- [ ] Functions deployed and tested
- [ ] Logs show secrets are loaded correctly

---

**Remember: Dashboard is the single source of truth for secrets!**

