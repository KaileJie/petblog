#!/usr/bin/env node

/**
 * Script to recreate the correct webhook endpoint
 * This will create a new endpoint with description "Pawstories edge functions"
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

function makeStripeRequest(path, method = 'POST', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path: `/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Stripe API error: ${parsed.error?.message || body}`));
          }
        } catch {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', (error) => reject(error));
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function main() {
  try {
    console.log('🔧 重新创建正确的 webhook endpoint...\n');
    
    const webhookUrl = 'https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook';
    const events = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed'
    ];
    
    // Build params correctly for Stripe API
    let params = `url=${encodeURIComponent(webhookUrl)}&description=${encodeURIComponent('Pawstories edge functions')}`;
    events.forEach(event => {
      params += `&enabled_events[]=${encodeURIComponent(event)}`;
    });
    
    console.log('创建端点配置:');
    console.log(`  URL: ${webhookUrl}`);
    console.log(`  描述: Pawstories edge functions`);
    console.log(`  事件: ${events.join(', ')}`);
    console.log('');
    
    const endpoint = await makeStripeRequest('/webhook_endpoints', 'POST', params.toString());
    
    console.log('✅ Webhook endpoint 创建成功!');
    console.log(`  ID: ${endpoint.id}`);
    console.log(`  描述: ${endpoint.description}`);
    console.log(`  URL: ${endpoint.url}`);
    console.log(`  状态: ${endpoint.status}`);
    console.log('');
    console.log('🔑 重要: 获取 Webhook Signing Secret');
    console.log('1. 访问: https://dashboard.stripe.com/webhooks');
    console.log(`2. 点击端点: ${endpoint.id}`);
    console.log('3. 找到 "Signing secret"');
    console.log('4. 点击 "Reveal" 显示完整 secret');
    console.log('5. 复制 secret (以 whsec_ 开头)');
    console.log('6. 更新 Supabase Dashboard 中的 STRIPE_WEBHOOK_SECRET');
    console.log('');
    console.log('Supabase Dashboard:');
    console.log('  https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();

