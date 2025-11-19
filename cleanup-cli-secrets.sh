#!/bin/bash
# Comprehensive CLI secrets cleanup script
# This ensures ALL secrets come from Dashboard only

echo "🔍 Starting comprehensive CLI secrets cleanup..."
echo ""

# List current CLI secrets
echo "📋 Current CLI secrets:"
supabase secrets list
echo ""

# Unset Stripe secrets
echo "🗑️  Unsetting STRIPE_SECRET_KEY..."
supabase secrets unset STRIPE_SECRET_KEY 2>&1

echo "🗑️  Unsetting STRIPE_WEBHOOK_SECRET..."
supabase secrets unset STRIPE_WEBHOOK_SECRET 2>&1

echo "🗑️  Unsetting STRIPE_PRICE_ID..."
supabase secrets unset STRIPE_PRICE_ID 2>&1

echo "🗑️  Unsetting SITE_URL..."
supabase secrets unset SITE_URL 2>&1

echo ""
echo "✅ CLI secrets cleanup complete!"
echo ""
echo "📋 Verifying secrets are unset..."
supabase secrets list | grep -E "(STRIPE_|SITE_URL)" || echo "✅ No Stripe/SITE_URL secrets found in CLI"
echo ""
echo "⚠️  IMPORTANT: All secrets must now be set via Dashboard:"
echo "   https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets"
echo ""
echo "Required Dashboard secrets:"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_WEBHOOK_SECRET"
echo "  - STRIPE_PRICE_ID"
echo "  - SITE_URL (optional, defaults to http://localhost:3000)"
