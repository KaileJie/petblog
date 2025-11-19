#!/bin/bash

# Simple script to delete "Mac" webhook endpoint from Stripe
# Usage: ./delete-mac-endpoint-simple.sh

echo "🗑️  删除 Stripe Dashboard 中的 'Mac' 端点"
echo ""

# Check if STRIPE_SECRET_KEY is set
if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "❌ 错误: 需要设置 STRIPE_SECRET_KEY 环境变量"
  echo ""
  echo "请先获取你的 Stripe Secret Key:"
  echo "1. 访问: https://dashboard.stripe.com/apikeys"
  echo "2. 复制你的 Secret key (以 sk_test_ 或 sk_live_ 开头)"
  echo ""
  echo "然后运行:"
  echo "  export STRIPE_SECRET_KEY=sk_test_你的密钥"
  echo "  ./delete-mac-endpoint-simple.sh"
  echo ""
  echo "或者一次性运行:"
  echo "  STRIPE_SECRET_KEY=sk_test_你的密钥 ./delete-mac-endpoint-simple.sh"
  exit 1
fi

echo "📋 正在获取所有 webhook endpoints..."
ENDPOINTS_JSON=$(curl -s -X GET "https://api.stripe.com/v1/webhook_endpoints?limit=100" \
  -u "$STRIPE_SECRET_KEY:" \
  -H "Content-Type: application/x-www-form-urlencoded")

if [ $? -ne 0 ]; then
  echo "❌ 错误: 无法连接到 Stripe API"
  exit 1
fi

# Check for API errors
if echo "$ENDPOINTS_JSON" | grep -q '"error"'; then
  echo "❌ Stripe API 错误:"
  echo "$ENDPOINTS_JSON" | grep -o '"message":"[^"]*"' | head -1
  exit 1
fi

# Extract endpoint IDs (simple approach - looks for we_ pattern)
ENDPOINT_IDS=$(echo "$ENDPOINTS_JSON" | grep -o '"id":"we_[^"]*"' | sed 's/"id":"\(.*\)"/\1/')

if [ -z "$ENDPOINT_IDS" ]; then
  echo "✅ 没有找到任何 webhook endpoints"
  exit 0
fi

echo "找到以下 endpoints:"
echo ""

MAC_ENDPOINT_ID=""

# Check each endpoint
for endpoint_id in $ENDPOINT_IDS; do
  echo "检查端点: $endpoint_id"
  
  # Get endpoint details
  endpoint_details=$(curl -s -X GET "https://api.stripe.com/v1/webhook_endpoints/$endpoint_id" \
    -u "$STRIPE_SECRET_KEY:" \
    -H "Content-Type: application/x-www-form-urlencoded")
  
  # Extract description and URL
  description=$(echo "$endpoint_details" | grep -o '"description":"[^"]*"' | sed 's/"description":"\(.*\)"/\1/' || echo "")
  url=$(echo "$endpoint_details" | grep -o '"url":"[^"]*"' | sed 's/"url":"\(.*\)"/\1/' || echo "")
  
  echo "  描述: ${description:-无}"
  echo "  URL: $url"
  
  # Check if this is the Mac endpoint
  if [ "$description" = "Mac" ] || ([ -n "$url" ] && echo "$url" | grep -q "supabase.co/functions/v1/stripe-webhook" && [ "$description" = "Mac" ]); then
    MAC_ENDPOINT_ID=$endpoint_id
    echo "  ✅ 找到 'Mac' 端点!"
    break
  fi
  echo ""
done

if [ -z "$MAC_ENDPOINT_ID" ]; then
  echo ""
  echo "⚠️  未找到 'Mac' 端点。可能已经被删除。"
  exit 0
fi

echo ""
echo "🗑️  正在删除 'Mac' 端点: $MAC_ENDPOINT_ID"
delete_response=$(curl -s -X DELETE "https://api.stripe.com/v1/webhook_endpoints/$MAC_ENDPOINT_ID" \
  -u "$STRIPE_SECRET_KEY:" \
  -H "Content-Type: application/x-www-form-urlencoded")

if echo "$delete_response" | grep -q '"deleted":true'; then
  echo "✅ 成功! 'Mac' 端点已删除。"
  echo ""
  echo "📋 剩余 endpoints:"
  remaining=$(curl -s -X GET "https://api.stripe.com/v1/webhook_endpoints?limit=100" \
    -u "$STRIPE_SECRET_KEY:" \
    -H "Content-Type: application/x-www-form-urlencoded")
  echo "$remaining" | grep -o '"id":"we_[^"]*"\|"description":"[^"]*"\|"url":"[^"]*"' | head -20
else
  echo "❌ 删除失败:"
  echo "$delete_response"
  exit 1
fi

