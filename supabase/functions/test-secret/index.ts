// 临时测试函数：验证 STRIPE_SECRET_KEY 是否正确加载
Deno.serve(async (req) => {
  const key = Deno.env.get('STRIPE_SECRET_KEY')
  
  const result = {
    exists: !!key,
    length: key?.length || 0,
    prefix: key ? key.substring(0, 20) : 'none',
    startsWithSk: key ? key.startsWith('sk_') : false,
    startsWithSkTest: key ? key.startsWith('sk_test_') : false,
    startsWithSkLive: key ? key.startsWith('sk_live_') : false,
    hasWhitespace: key ? /\s/.test(key) : false,
    trimmedLength: key ? key.trim().length : 0,
    isValidFormat: key ? (key.startsWith('sk_test_') || key.startsWith('sk_live_')) && key.length > 50 : false,
  }
  
  // 列出所有包含 STRIPE 的环境变量（不显示值）
  const allEnv = Deno.env.toObject()
  const stripeEnvVars = Object.keys(allEnv).filter((key) =>
    key.toUpperCase().includes('STRIPE')
  )
  
  return new Response(JSON.stringify({
    ...result,
    availableStripeEnvVars: stripeEnvVars,
    status: result.isValidFormat ? '✅ Valid' : '❌ Invalid',
  }, null, 2), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})

