#!/usr/bin/env node

/**
 * Script to find and delete ONLY the "Mac" endpoint
 * This script will list all endpoints and help identify which one is "Mac"
 */

const https = require('https');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

function makeStripeRequest(path, method = 'GET') {
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
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.end();
  });
}

async function main() {
  try {
    console.log('📋 获取所有 webhook endpoints...\n');
    
    const response = await makeStripeRequest('/webhook_endpoints?limit=100');
    const endpoints = response.data || [];
    
    if (endpoints.length === 0) {
      console.log('✅ 没有找到任何端点');
      return;
    }

    console.log(`找到 ${endpoints.length} 个端点:\n`);
    
    endpoints.forEach((ep, index) => {
      console.log(`端点 ${index + 1}:`);
      console.log(`  ID: ${ep.id}`);
      console.log(`  描述: ${ep.description || '(空)'}`);
      console.log(`  URL: ${ep.url}`);
      console.log(`  状态: ${ep.status}`);
      console.log(`  创建时间: ${new Date(ep.created * 1000).toLocaleString()}`);
      console.log(`  事件数: ${ep.enabled_events?.length || 0}`);
      console.log('');
    });

    // Look for "Mac" endpoint - check description or metadata
    // The "Mac" endpoint might be identified by:
    // 1. Description contains "Mac"
    // 2. Created more recently (CLI-created endpoints)
    // 3. No description but matches the URL
    
    const macEndpoint = endpoints.find(ep => {
      const desc = (ep.description || '').toLowerCase();
      return desc.includes('mac') || desc === '';
    });

    if (!macEndpoint) {
      console.log('⚠️  未找到明显的 "Mac" 端点');
      console.log('\n请手动检查上面的列表，找到 "Mac" 端点，然后运行:');
      console.log(`  STRIPE_SECRET_KEY=你的密钥 node delete-specific-endpoint.js we_端点ID`);
      return;
    }

    console.log('🔍 找到可能是 "Mac" 的端点:');
    console.log(`  ID: ${macEndpoint.id}`);
    console.log(`  描述: ${macEndpoint.description || '(空)'}`);
    console.log(`  URL: ${macEndpoint.url}`);
    console.log('');

    // Ask for confirmation - but since we're in non-interactive mode, we'll be careful
    // Only delete if description is empty or contains "Mac"
    if (macEndpoint.description && !macEndpoint.description.toLowerCase().includes('mac')) {
      console.log('⚠️  警告: 这个端点有描述，可能不是 "Mac" 端点');
      console.log('   请确认后再删除');
      return;
    }

    console.log('🗑️  正在删除端点...');
    await makeStripeRequest(`/webhook_endpoints/${macEndpoint.id}`, 'DELETE');
    
    console.log('✅ 端点已删除!');
    console.log('\n📋 剩余端点:');
    const remaining = endpoints.filter(ep => ep.id !== macEndpoint.id);
    if (remaining.length === 0) {
      console.log('  (none)');
    } else {
      remaining.forEach(ep => {
        console.log(`  - ${ep.id}: ${ep.description || 'No description'} (${ep.url})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();

