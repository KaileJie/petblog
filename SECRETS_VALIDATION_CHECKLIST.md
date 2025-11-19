# Secrets 详细验证清单

## ✅ 基础检查结果

所有 7 个必需的 secrets 都已设置！现在请按照以下清单验证每个值的格式是否正确。

---

## 1. STRIPE_SECRET_KEY

**代码中使用位置:**
- `stripe-checkout/index.ts` (第 9 行)
- `stripe-webhook/index.ts` (第 4 行)
- `stripe-portal/index.ts` (第 4 行)

**验证清单:**
- [ ] 名称完全匹配: `STRIPE_SECRET_KEY` (区分大小写)
- [ ] 值以 `sk_test_` 开头（测试环境）或 `sk_live_` 开头（生产环境）
- [ ] 值长度约 100+ 字符
- [ ] 值前后没有空格或换行符
- [ ] 不是 Publishable Key (`pk_` 开头)

**如何获取:**
1. 访问: https://dashboard.stripe.com/test/apikeys
2. 找到 "Secret key"
3. 点击 "Reveal test key"
4. 复制完整值（以 `sk_test_` 开头）

---

## 2. STRIPE_WEBHOOK_SECRET

**代码中使用位置:**
- `stripe-webhook/index.ts` (第 9 行)

**验证清单:**
- [ ] 名称完全匹配: `STRIPE_WEBHOOK_SECRET`
- [ ] 值以 `whsec_` 开头
- [ ] 值长度约 50+ 字符
- [ ] 值前后没有空格或换行符

**如何获取:**
1. 访问: https://dashboard.stripe.com/test/webhooks
2. 找到你的 webhook endpoint
3. 点击 endpoint → "Signing secret" → "Reveal"
4. 复制完整值（以 `whsec_` 开头）

---

## 3. STRIPE_PRICE_ID

**代码中使用位置:**
- `stripe-checkout/index.ts` (第 129 行)

**验证清单:**
- [ ] 名称完全匹配: `STRIPE_PRICE_ID`
- [ ] 值以 `price_` 开头
- [ ] 值格式: `price_1SSVzWRx0nbLiT9kqqeHNMBv` (示例)
- [ ] 值前后没有空格或换行符

**如何获取:**
1. 访问: https://dashboard.stripe.com/test/products
2. 点击你的产品
3. 找到 Price ID（以 `price_` 开头）
4. 复制完整值

---

## 4. SUPABASE_URL

**代码中使用位置:**
- `stripe-checkout/index.ts` (第 58 行)
- `stripe-webhook/index.ts` (第 65 行)
- `stripe-portal/index.ts` (第 32 行)

**验证清单:**
- [ ] 名称完全匹配: `SUPABASE_URL`
- [ ] 值格式: `https://wqinxqlsmoroqgqpdjfk.supabase.co`
- [ ] 包含你的项目 ID: `wqinxqlsmoroqgqpdjfk`
- [ ] 以 `https://` 开头
- [ ] 以 `.supabase.co` 结尾
- [ ] 没有尾部斜杠 `/`

**如何获取:**
1. 访问: https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/settings/api
2. 在 "Project URL" 部分找到 URL
3. 复制完整 URL（不包含尾部斜杠）

---

## 5. SUPABASE_ANON_KEY

**代码中使用位置:**
- `stripe-checkout/index.ts` (第 59 行)
- `stripe-portal/index.ts` (第 33 行)

**验证清单:**
- [ ] 名称完全匹配: `SUPABASE_ANON_KEY`
- [ ] 值以 `eyJ` 开头（JWT token）
- [ ] 值长度约 200+ 字符
- [ ] 值前后没有空格或换行符
- [ ] 与 `SUPABASE_SERVICE_ROLE_KEY` 不同

**如何获取:**
1. 访问: https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/settings/api
2. 在 "Project API keys" 部分找到 "anon" / "public" key
3. 复制完整值（以 `eyJ` 开头）

---

## 6. SUPABASE_SERVICE_ROLE_KEY

**代码中使用位置:**
- `stripe-webhook/index.ts` (第 66 行)

**验证清单:**
- [ ] 名称完全匹配: `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 值以 `eyJ` 开头（JWT token）
- [ ] 值长度约 200+ 字符
- [ ] 值前后没有空格或换行符
- [ ] 与 `SUPABASE_ANON_KEY` 不同
- [ ] ⚠️ **重要**: 这是敏感密钥，不要暴露给客户端

**如何获取:**
1. 访问: https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/settings/api
2. 在 "Project API keys" 部分找到 "service_role" key
3. 点击 "Reveal" 显示密钥
4. 复制完整值（以 `eyJ` 开头）

---

## 7. SITE_URL

**代码中使用位置:**
- `stripe-checkout/index.ts` (第 189 行)
- `stripe-portal/index.ts` (第 71 行)

**验证清单:**
- [ ] 名称完全匹配: `SITE_URL`
- [ ] 开发环境: `http://localhost:3000`
- [ ] 生产环境: `https://yourdomain.com`
- [ ] 没有尾部斜杠 `/`
- [ ] 是有效的 URL 格式

**设置建议:**
- 开发环境: `http://localhost:3000`
- 生产环境: 你的实际域名（如 `https://petblog.com`）

---

## 🔍 常见错误检查

### 错误 1: 名称大小写不匹配
- ❌ `stripe_secret_key` (小写)
- ❌ `Stripe_Secret_Key` (混合大小写)
- ✅ `STRIPE_SECRET_KEY` (全大写)

### 错误 2: 值中有多余空格
- ❌ ` sk_test_51... ` (前后有空格)
- ❌ `sk_test_51...\n` (有换行符)
- ✅ `sk_test_51...` (干净的值)

### 错误 3: 使用了错误的 Key 类型
- ❌ `pk_test_...` (Publishable Key，用于客户端)
- ✅ `sk_test_...` (Secret Key，用于服务器)

### 错误 4: URL 格式错误
- ❌ `https://wqinxqlsmoroqgqpdjfk.supabase.co/` (有尾部斜杠)
- ❌ `wqinxqlsmoroqgqpdjfk.supabase.co` (缺少协议)
- ✅ `https://wqinxqlsmoroqgqpdjfk.supabase.co` (正确格式)

---

## ✅ 验证完成后的步骤

1. **确认所有 secrets 格式正确**
   - 按照上述清单逐个检查
   - 确保名称和值都正确

2. **重新部署函数**
   ```bash
   supabase functions deploy stripe-checkout
   supabase functions deploy stripe-webhook
   supabase functions deploy stripe-portal
   ```

3. **测试功能**
   - 刷新浏览器
   - 尝试订阅流程
   - 查看函数日志确认没有错误

4. **查看函数日志**
   - 访问: https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs
   - 查看最新的日志，应该看到 "Stripe key check" 显示 key 存在

---

## 🆘 如果问题仍然存在

如果验证后仍然出现 `STRIPE_SECRET_KEY is not configured` 错误：

1. **检查 Dashboard 中的 secrets**
   - 访问: https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets
   - 确认每个 secret 的名称完全匹配（区分大小写）

2. **尝试删除并重新设置**
   ```bash
   # 删除旧的 secret
   supabase secrets unset STRIPE_SECRET_KEY
   
   # 重新设置
   supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
   
   # 重新部署
   supabase functions deploy stripe-checkout
   ```

3. **查看详细的函数日志**
   - 日志中应该显示 "Stripe key check" 和 "Available STRIPE env vars"
   - 这将帮助我们确定问题所在

---

**请按照此清单逐个验证每个 secret，确保格式完全正确！**

