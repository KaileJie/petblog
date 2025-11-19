# 🔐 Secrets Configuration - Quick Reference

## ⚠️ IMPORTANT: Dashboard-Only Approach

**This project uses Dashboard-only secrets management. CLI secrets commands are NOT used.**

## Quick Links

- **Dashboard Secrets**: https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets
- **Function Logs**: https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs

## Required Secrets

Configure these in Dashboard:

1. `STRIPE_SECRET_KEY` - Stripe API secret key (`sk_test_...`)
2. `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (`whsec_...`)
3. `STRIPE_PRICE_ID` - Stripe price ID (`price_...`)
4. `SITE_URL` - Your site URL (`http://localhost:3000` or production URL)

## How to Set Secrets

1. Go to Dashboard → Edge Functions → Variables (Secrets)
2. Click "Add new secret"
3. Enter name (exact match, case-sensitive)
4. Enter value (no spaces before/after)
5. Click "Save"
6. Deploy function: `supabase functions deploy FUNCTION_NAME`

## Verification

Test secrets are loaded:
```bash
# Deploy test function
supabase functions deploy test-secret

# Call it (replace YOUR_ANON_KEY)
curl -X POST \
  'https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/test-secret' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

## Documentation

- `FINAL_SECRETS_CONFIGURATION.md` - Complete setup instructions
- `DASHBOARD_ONLY_SECRETS_GUIDE.md` - Dashboard-only reference
- `CLEANUP_CLI_SECRETS.md` - Cleanup guide

## ❌ Don't Use

```bash
# ❌ DON'T USE THESE
supabase secrets set ...
supabase secrets unset ...
supabase secrets list
```

**Always use Dashboard for secrets management!**

