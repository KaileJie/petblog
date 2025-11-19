# 🔍 问题诊断指南

## 问题 1: 订阅循环 - 验证成功但查询返回 null

### 症状
- ✅ 验证成功（"Subscription verified successfully!"）
- ✅ 重定向到 dashboard
- ❌ 但订阅检查返回 null
- ❌ 又重定向回 subscribe 页面

### 可能原因

#### 原因 A: RLS 策略问题
**检查：**
```sql
-- 在 Supabase SQL Editor 中运行
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE tablename = 'subscriptions';
```

**应该看到：**
- Policy: "Users can view own subscription"
- CMD: SELECT
- QUAL: `(auth.uid() = user_id)`

**如果缺失，运行：**
```sql
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

#### 原因 B: 数据库写入失败
**检查 Edge Function 日志：**
- Supabase Dashboard → Edge Functions → `validate-stripe-session` → Logs
- 查找：`✅ Subscription upserted successfully`
- 查找：`✅ Verified subscription exists in database`

**如果看到错误：**
- 检查 `upsertError` 消息
- 检查 RLS 策略是否允许 service_role 写入

#### 原因 C: 查询时机问题
**已修复：** 代码现在会重试 5 次，每次间隔 500ms

**检查浏览器控制台：**
- 应该看到：`📊 Subscription check (retries left: X)`
- 如果所有重试都失败，会显示错误消息

### 诊断步骤

1. **检查数据库是否有订阅记录：**
```sql
-- 替换 YOUR_USER_ID 为实际用户 ID
SELECT * FROM subscriptions 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

2. **检查 RLS 策略：**
```sql
-- 检查当前用户的权限
SELECT auth.uid() as current_user_id;

-- 检查订阅记录
SELECT id, user_id, status 
FROM subscriptions 
WHERE user_id = auth.uid();
```

3. **检查浏览器控制台：**
- 打开开发者工具（F12）
- 查看 Console 标签
- 查找：
  - `📊 Subscription check result`
  - `❌ Error checking subscription`
  - `⚠️ Permission error`

---

## 问题 2: Webhook 签名验证失败

### 症状
- ❌ `StripeSignatureVerificationError`
- ❌ `No signatures found matching the expected signature`

### 可能原因

#### 原因 A: Webhook Secret 不匹配
**最可能的原因！**

**检查步骤：**
1. **Stripe Dashboard:**
   - 访问：https://dashboard.stripe.com/test/webhooks
   - 点击你的 webhook endpoint
   - 点击 "Reveal" 或 "Copy" 获取 Signing secret
   - 完整复制（以 `whsec_` 开头）

2. **Supabase Dashboard:**
   - 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets
   - 找到 `STRIPE_WEBHOOK_SECRET`
   - 点击 "Edit"
   - 确保值与 Stripe Dashboard 中的完全一致
   - **重要：** 没有多余空格、换行符、或特殊字符
   - 保存

3. **验证：**
   - 触发测试 webhook
   - 查看日志中的 `Webhook secret prefix` 和 `ends with`
   - 应该与 Stripe Dashboard 中的一致

#### 原因 B: Webhook Endpoint URL 错误
**检查：**
- Stripe Dashboard → Webhooks → Your endpoint
- URL 应该是：`https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook`
- 确保没有尾随斜杠

#### 原因 C: 原始请求体被修改
**已修复：** 代码现在使用 `arrayBuffer()` 获取原始字节

**如果仍然失败：**
- 检查 Edge Function 日志中的 `Raw body first 100 chars`
- 应该看到 JSON 格式的 webhook 事件
- 如果看到其他内容，可能是请求被修改

### 诊断步骤

1. **验证 Webhook Secret:**
```bash
# 在 Supabase Dashboard Secrets 中检查
# 长度应该是 38 字符（对于 whsec_ 开头的 secret）
# 前缀应该是 whsec_
```

2. **测试 Webhook Secret:**
   - 在 Stripe Dashboard 中发送测试 webhook
   - 查看 Edge Function 日志
   - 检查签名验证是否成功

3. **检查 Webhook 事件：**
   - 确保 webhook endpoint 启用了正确的事件：
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

---

## 快速修复清单

### 订阅循环问题

- [ ] 检查 RLS 策略是否存在且正确
- [ ] 检查数据库是否有订阅记录
- [ ] 检查浏览器控制台错误
- [ ] 检查 Edge Function 日志中的 upsert 错误
- [ ] 确认用户 ID 匹配（`auth.uid() = user_id`）

### Webhook 签名问题

- [ ] 确认 `STRIPE_WEBHOOK_SECRET` 与 Stripe Dashboard 完全一致
- [ ] 确认没有多余空格或换行符
- [ ] 确认 webhook endpoint URL 正确
- [ ] 确认 webhook 事件已启用
- [ ] 重新复制 signing secret 并更新

---

## 测试命令

### 检查订阅记录
```sql
-- 查看所有订阅
SELECT 
  id,
  user_id,
  stripe_subscription_id,
  status,
  created_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 10;
```

### 检查 RLS 策略
```sql
-- 查看所有策略
SELECT * FROM pg_policies WHERE tablename = 'subscriptions';
```

### 测试用户权限
```sql
-- 作为当前用户测试查询
SELECT * FROM subscriptions WHERE user_id = auth.uid();
```

---

## 如果问题仍然存在

1. **收集日志：**
   - Edge Function 日志（`validate-stripe-session` 和 `stripe-webhook`）
   - 浏览器控制台日志
   - 数据库查询结果

2. **检查配置：**
   - Supabase Dashboard Secrets
   - Stripe Dashboard Webhook 配置
   - RLS 策略

3. **提供信息：**
   - 错误消息
   - 日志片段
   - 数据库查询结果

---

**最后更新：** 2025-11-14

