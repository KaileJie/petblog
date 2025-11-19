#!/usr/bin/env node

/**
 * Script to delete the "Mac" webhook endpoint from Stripe
 * 
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... node delete-mac-endpoint.js
 * 
 * Or set the key in your environment:
 *   export STRIPE_SECRET_KEY=sk_test_...
 *   node delete-mac-endpoint.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required');
  console.error('');
  console.error('Usage:');
  console.error('  STRIPE_SECRET_KEY=sk_test_... node delete-mac-endpoint.js');
  console.error('');
  console.error('Or get your key from: https://dashboard.stripe.com/apikeys');
  process.exit(1);
}

// Stripe API base URL
const STRIPE_API_BASE = 'api.stripe.com';

function makeStripeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: STRIPE_API_BASE,
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
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
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

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

async function listWebhookEndpoints() {
  try {
    console.log('📋 Fetching webhook endpoints...');
    const response = await makeStripeRequest('/webhook_endpoints?limit=100');
    return response.data || [];
  } catch (error) {
    console.error('❌ Error listing webhook endpoints:', error.message);
    throw error;
  }
}

async function deleteWebhookEndpoint(endpointId) {
  try {
    console.log(`🗑️  Deleting webhook endpoint: ${endpointId}...`);
    await makeStripeRequest(`/webhook_endpoints/${endpointId}`, 'DELETE');
    console.log('✅ Webhook endpoint deleted successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error deleting webhook endpoint:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔍 Searching for "Mac" webhook endpoint...\n');
    
    const endpoints = await listWebhookEndpoints();
    
    if (endpoints.length === 0) {
      console.log('✅ No webhook endpoints found.');
      return;
    }

    console.log(`Found ${endpoints.length} webhook endpoint(s):\n`);
    
    // Find the "Mac" endpoint
    // Stripe CLI may create endpoints without description, so we check:
    // 1. Description is "Mac"
    // 2. Description is empty/null AND URL matches (likely CLI-created)
    // 3. Check if there are multiple endpoints with same URL (one might be Mac)
    const macEndpoint = endpoints.find(ep => 
      ep.description === 'Mac' || 
      (ep.url.includes('supabase.co/functions/v1/stripe-webhook') && !ep.description)
    );

    // If multiple endpoints exist with same URL, the one without description is likely "Mac"
    const endpointsWithSameUrl = endpoints.filter(ep => 
      ep.url.includes('supabase.co/functions/v1/stripe-webhook')
    );
    
    if (endpointsWithSameUrl.length > 1) {
      // If multiple endpoints with same URL, delete the one without description
      const endpointToDelete = endpointsWithSameUrl.find(ep => !ep.description) || endpointsWithSameUrl[0];
      console.log('⚠️  发现多个相同 URL 的端点，删除无描述的端点（可能是 "Mac"）:');
      console.log(`  ID: ${endpointToDelete.id}`);
      console.log(`  URL: ${endpointToDelete.url}`);
      console.log(`  Description: ${endpointToDelete.description || 'None (likely Mac endpoint)'}`);
      console.log('');
      
      await deleteWebhookEndpoint(endpointToDelete.id);
      
      console.log('\n✅ Success! 端点已删除。');
      console.log('\n📋 剩余端点:');
      const remaining = endpoints.filter(ep => ep.id !== endpointToDelete.id);
      if (remaining.length === 0) {
        console.log('  (none)');
      } else {
        remaining.forEach(ep => {
          console.log(`  - ${ep.id}: ${ep.description || 'No description'} (${ep.url})`);
        });
      }
      return;
    }

    if (!macEndpoint) {
      console.log('⚠️  "Mac" endpoint not found. Available endpoints:');
      endpoints.forEach(ep => {
        console.log(`  - ${ep.id}: ${ep.description || 'No description'} (${ep.url})`);
      });
      console.log('\n💡 提示: 如果 "Mac" 端点仍然在 Dashboard 中显示，可能需要等待几分钟让状态更新。');
      console.log('   或者这个端点可能已经被删除，但 Dashboard 还未刷新。');
      return;
    }

    console.log('Found "Mac" endpoint:');
    console.log(`  ID: ${macEndpoint.id}`);
    console.log(`  URL: ${macEndpoint.url}`);
    console.log(`  Status: ${macEndpoint.status}`);
    console.log(`  Description: ${macEndpoint.description || 'None'}`);
    console.log('');

    // Delete the endpoint
    await deleteWebhookEndpoint(macEndpoint.id);
    
    console.log('\n✅ Success! The "Mac" endpoint has been deleted.');
    console.log('\n📋 Remaining endpoints:');
    const remaining = endpoints.filter(ep => ep.id !== macEndpoint.id);
    if (remaining.length === 0) {
      console.log('  (none)');
    } else {
      remaining.forEach(ep => {
        console.log(`  - ${ep.id}: ${ep.description || 'No description'} (${ep.url})`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

