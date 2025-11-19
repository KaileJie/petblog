# 🔍 Stripe Secret Key 问题诊断和修复指南

## 当前状态

✅ **Secret 已存在**: `STRIPE_SECRET_KEY` 在 secrets 列表中
❌ **问题**: Secret key 仍然显示不正确

## 🔍 可能的原因

### 1. Secret 值格式问题（最常见）
- Secret 值前后可能有空格或换行符
- Secret 值可能被截断
- Secret 值可能使用了错误的 key（Publishable Key 而不是 Secret Key）

### 2. 函数未重新部署
- 修改 secret 后必须重新部署函数才能生效

### 3. Secret 名称问题
- 名称可能有隐藏字符或空格

## 🚀 完整修复步骤

### 步骤 1: 验证 Stripe Secret Key 格式

1. **访问 Stripe Dashboard**
   - 打开：https://dashboard.stripe.com/test/apikeys
   - 找到 "Secret key"（不是 Publishable key）
   - 点击 "Reveal test key"
   - 复制完整的 key（应该以 `sk_test_` 开头，长度约 100+ 字符）

2. **验证 Key 格式**
   - ✅ 必须以 `sk_test_` 开头（测试环境）或 `sk_live_` 开头（生产环境）
   - ✅ 长度应该约 100+ 字符
   - ✅ 不应该有前后空格
   - ❌ 不能是 `pk_test_` 开头的 Publishable Key

### 步骤 2: 通过 CLI 重新设置 Secret（推荐方法）

```bash
cd /Users/dallylovely/Desktop/Jie/AI/PetBlog/petblog

# 1. 先删除旧的 secret
supabase secrets unset STRIPE_SECRET_KEY

# 2. 重新设置（确保值完整，没有空格）
# 替换 YOUR_STRIPE_SECRET_KEY 为你的完整 Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_COMPLETE_KEY_HERE

# 3. 验证设置
supabase secrets list | grep STRIPE_SECRET_KEY
```

**重要提示**：
- 在设置时，确保 `=` 后面没有空格
- 确保 key 值完整且正确
- 如果 key 值包含特殊字符，可能需要用引号包裹

### 步骤 3: 重新部署所有相关函数

```bash
# 部署 stripe-checkout 函数
supabase functions deploy stripe-checkout

# 部署 stripe-webhook 函数
supabase functions deploy stripe-webhook

# 部署 stripe-portal 函数（如果存在）
supabase functions deploy stripe-portal
```

### 步骤 4: 验证 Secret 是否正确加载

1. **查看函数日志**
   - 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs
   - 查找最新的日志条目
   - 应该看到：
     ```
     Stripe key check: {
       hasSTRIPE_SECRET_KEY: true,
       keyLength: 100+,
       keyPrefix: "sk_test_..."
     }
     ```

2. **测试订阅功能**
   - 刷新浏览器页面
   - 尝试创建订阅
   - 应该能成功重定向到 Stripe Checkout

## 🔧 如果问题仍然存在

### 方法 A: 通过 Dashboard 手动设置

1. **访问 Secrets 页面**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

2. **删除旧的 STRIPE_SECRET_KEY**
   - 找到 `STRIPE_SECRET_KEY`
   - 点击删除
   - 确认删除

3. **添加新的 STRIPE_SECRET_KEY**
   - 点击 "Add new secret"
   - **名称**: `STRIPE_SECRET_KEY`（完全匹配，全大写，没有空格）
   - **值**: 粘贴你的完整 Stripe Secret Key
   - 确保值前后没有空格
   - 保存

4. **重新部署函数**
   ```bash
   supabase functions deploy stripe-checkout
   ```

### 方法 B: 检查 Secret 值是否有问题

创建一个临时的诊断函数来检查 secret 值：

```bash
# 创建一个临时诊断函数
cat > /tmp/test-secret.ts << 'EOF'
Deno.serve(async (req) => {
  const key = Deno.env.get('STRIPE_SECRET_KEY')
  return new Response(JSON.stringify({
    exists: !!key,
    length: key?.length || 0,
    prefix: key ? key.substring(0, 15) : 'none',
    hasWhitespace: key ? /\s/.test(key) : false,
    startsWithSk: key ? key.startsWith('sk_') : false,
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
EOF

# 部署临时函数
supabase functions deploy test-secret --no-verify-jwt

# 调用函数查看结果
curl https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/test-secret
```

## ⚠️ 常见错误

### 错误 1: 使用了 Publishable Key
- ❌ `pk_test_...` (这是 Publishable Key，不能用于服务器端)
- ✅ `sk_test_...` (这是 Secret Key，用于服务器端)

### 错误 2: Secret 值有空格
- ❌ ` sk_test_... ` (前后有空格)
- ✅ `sk_test_...` (没有空格)

### 错误 3: Secret 值不完整
- ❌ `sk_test_51EXAMPLE...` (被截断，不完整)
- ✅ `sk_test_51EXAMPLE1234567890abcdefghijklmnopqrstuvwxyz...` (完整，100+ 字符)

### 错误 4: 没有重新部署函数
- 修改 secret 后必须重新部署函数才能生效

## 📋 检查清单

在修复后，确认：

- [ ] Stripe Secret Key 以 `sk_test_` 或 `sk_live_` 开头
- [ ] Secret Key 长度约 100+ 字符
- [ ] Secret Key 前后没有空格
- [ ] 使用的是 Secret Key，不是 Publishable Key
- [ ] 已通过 CLI 或 Dashboard 重新设置 secret
- [ ] 已重新部署所有相关函数
- [ ] 函数日志显示 `hasSTRIPE_SECRET_KEY: true`
- [ ] 订阅功能可以正常工作

## 🆘 如果以上方法都不行

1. **检查 Supabase 项目设置**
   - 确认项目 ID 正确：`wqinxqlsmoroqgqpdjfk`
   - 确认你有权限管理 secrets

2. **联系 Supabase 支持**
   - 如果所有方法都失败，可能是 Supabase 平台的问题
   - 提供函数日志和 secret 设置截图

3. **尝试使用不同的 Stripe Key**
   - 生成新的 Stripe Secret Key
   - 重新设置 secret

---

**建议先尝试步骤 2（通过 CLI 重新设置），这是最可靠的方法！**

