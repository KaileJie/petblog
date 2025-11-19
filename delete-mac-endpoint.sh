#!/bin/bash

# Script to delete the "Mac" webhook endpoint from Stripe
# This script uses the Stripe API directly

echo "🔍 Deleting 'Mac' webhook endpoint from Stripe..."
echo ""

# Check if STRIPE_SECRET_KEY is set
if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "❌ Error: STRIPE_SECRET_KEY environment variable is required"
  echo ""
  echo "Usage:"
  echo "  export STRIPE_SECRET_KEY=sk_test_..."
  echo "  ./delete-mac-endpoint.sh"
  echo ""
  echo "Or:"
  echo "  STRIPE_SECRET_KEY=sk_test_... ./delete-mac-endpoint.sh"
  echo ""
  echo "Get your API key from: https://dashboard.stripe.com/apikeys"
  exit 1
fi

# List all webhook endpoints
echo "📋 Fetching webhook endpoints..."
ENDPOINTS=$(curl -s -X GET "https://api.stripe.com/v1/webhook_endpoints?limit=100" \
  -u "$STRIPE_SECRET_KEY:" \
  -H "Content-Type: application/x-www-form-urlencoded")

# Check if curl was successful
if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to fetch webhook endpoints"
  exit 1
fi

# Extract endpoint IDs and descriptions using grep/sed (basic parsing)
# Note: This is a simple approach. For production, use jq if available.
MAC_ENDPOINT_ID=$(echo "$ENDPOINTS" | grep -o '"id":"we_[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')

# Try to find Mac endpoint by checking all endpoints
echo "$ENDPOINTS" | grep -o '"id":"we_[^"]*"' | while read -r endpoint_line; do
  endpoint_id=$(echo "$endpoint_line" | sed 's/"id":"\(.*\)"/\1/')
  
  # Get endpoint details
  endpoint_details=$(curl -s -X GET "https://api.stripe.com/v1/webhook_endpoints/$endpoint_id" \
    -u "$STRIPE_SECRET_KEY:" \
    -H "Content-Type: application/x-www-form-urlencoded")
  
  # Check if this is the Mac endpoint
  if echo "$endpoint_details" | grep -q '"description":"Mac"' || \
     (echo "$endpoint_details" | grep -q 'supabase.co/functions/v1/stripe-webhook' && \
      echo "$endpoint_details" | grep -q '"description":"Mac"'); then
    
    echo "Found 'Mac' endpoint: $endpoint_id"
    echo "🗑️  Deleting endpoint..."
    
    # Delete the endpoint
    delete_response=$(curl -s -X DELETE "https://api.stripe.com/v1/webhook_endpoints/$endpoint_id" \
      -u "$STRIPE_SECRET_KEY:" \
      -H "Content-Type: application/x-www-form-urlencoded")
    
    if echo "$delete_response" | grep -q '"deleted":true'; then
      echo "✅ Success! 'Mac' endpoint deleted."
      exit 0
    else
      echo "❌ Error deleting endpoint: $delete_response"
      exit 1
    fi
  fi
done

echo "⚠️  'Mac' endpoint not found. It may have already been deleted."
echo ""
echo "Current webhook endpoints:"
echo "$ENDPOINTS" | grep -o '"id":"we_[^"]*"\|"url":"[^"]*"\|"description":"[^"]*"' | head -20

