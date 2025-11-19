#!/bin/bash
# One-time script to unset CLI secrets so they can be set via Dashboard

echo "🔧 Unsetting CLI secrets (so they can be set via Dashboard)..."
echo ""

# Unset Stripe secrets (these should be editable, not reserved)
echo "Unsetting STRIPE_SECRET_KEY..."
supabase secrets unset STRIPE_SECRET_KEY

echo "Unsetting STRIPE_WEBHOOK_SECRET..."
supabase secrets unset STRIPE_WEBHOOK_SECRET

echo "Unsetting STRIPE_PRICE_ID..."
supabase secrets unset STRIPE_PRICE_ID

echo "Unsetting SITE_URL..."
supabase secrets unset SITE_URL

echo ""
echo "✅ Done! Now set these secrets via Dashboard:"
echo "   https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets"
echo ""
echo "⚠️  Note: SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY"
echo "   are auto-provided and should remain reserved (don't unset them)."
