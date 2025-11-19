# 🧪 订阅流程测试指南

## 测试前准备

### 1. 确认数据库迁移已应用
```bash
cd petblog
supabase db push
```

### 2. 确认 Dashboard Secrets 已设置
访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

确认以下密钥存在：
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET` (必须与 Stripe Dashboard 中的 webhook signing secret 完全一致)
- ✅ `STRIPE_PRICE_ID`
- ✅ `SITE_URL` (可选，默认 `http://localhost:3000`)

### 3. 确认 Stripe Webhook 配置
访问：https://dashboard.stripe.com/test/webhooks

确认：
- ✅ Webhook endpoint URL: `https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook`
- ✅ 事件已启用：`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- ✅ Signing secret 已复制到 Supabase Dashboard

---

## 测试流程

### 测试 1: 新用户订阅流程 ✅

**步骤：**
1. 启动开发服务器：
   ```bash
   pnpm dev
   ```

2. 访问订阅页面：
   - 打开 `http://localhost:3000/subscribe`
   - 确保已登录

3. 点击 "Subscribe Now"
   - 应该重定向到 Stripe Checkout

4. 完成支付（使用 Stripe 测试卡）：
   - 卡号：`4242 4242 4242 4242`
   - 过期日期：任何未来日期
   - CVC：任意 3 位数字
   - 邮编：任意 5 位数字

5. 支付完成后：
   - ✅ 应该重定向到 `/dashboard?session_id=cs_test_...`
   - ✅ 应该看到 "Verifying your subscription..." 消息
   - ✅ 然后看到 "Welcome to PawStories Premium!" 消息
   - ✅ 最后应该显示 dashboard（无重定向循环）

6. 验证数据库：
   - 在 Supabase Dashboard → Table Editor → `subscriptions`
   - 确认新订阅记录已创建
   - 确认所有字段都已填充：
     - `user_id`
     - `stripe_customer_id`
     - `stripe_subscription_id`
     - `status` (应该是 `trialing` 或 `active`)
     - `price_id`
     - `current_period_start`
     - `current_period_end`
     - `trial_start`
     - `trial_end`

**预期结果：**
- ✅ 无重定向循环
- ✅ 订阅成功创建
- ✅ Dashboard 正常显示

---

### 测试 2: Webhook 处理 ✅

**步骤：**
1. 在 Stripe Dashboard → Webhooks
2. 找到你的 webhook endpoint
3. 点击 "Send test webhook"
4. 选择事件：`checkout.session.completed`
5. 发送测试 webhook

6. 检查 Supabase Edge Function 日志：
   - Dashboard → Edge Functions → `stripe-webhook` → Logs
   - 应该看到：
     - ✅ `🔐 Secret source: Dashboard (Deno.env.get)`
     - ✅ `✅ Signature verified successfully!`
     - ✅ `✅ Subscription created for user: ...`

7. 验证数据库：
   - 确认订阅记录已创建或更新
   - 确认所有字段正确

**预期结果：**
- ✅ Webhook 签名验证成功
- ✅ 订阅数据正确写入数据库
- ✅ 无错误日志

---

### 测试 3: 已订阅用户访问订阅页面 ✅

**步骤：**
1. 使用已有订阅的用户登录
2. 访问 `http://localhost:3000/subscribe`
3. 应该：
   - ✅ 立即重定向到 `/dashboard`
   - ✅ 不显示订阅表单
   - ✅ 无重定向循环

**预期结果：**
- ✅ 已订阅用户被正确重定向
- ✅ 无订阅表单显示

---

### 测试 4: 未订阅用户访问 Dashboard ✅

**步骤：**
1. 使用没有订阅的用户登录
2. 访问 `http://localhost:3000/dashboard`
3. 应该：
   - ✅ 重定向到 `/subscribe`
   - ✅ 无错误
   - ✅ 无重定向循环

**预期结果：**
- ✅ 未订阅用户被正确重定向
- ✅ 无错误发生

---

### 测试 5: 订阅状态检查 ✅

**步骤：**
1. 在浏览器控制台检查日志
2. 访问 `/dashboard` 时应该看到：
   ```
   🔍 DashboardContent rendered, sessionId: ...
   🔍 useEffect triggered: ...
   📊 Subscription check result: { subscription: {...}, userId: ... }
   ```

3. 如果有订阅：
   - ✅ `subscription` 不为 null
   - ✅ `status` 是 `active` 或 `trialing`

4. 如果没有订阅：
   - ✅ `subscription` 为 null
   - ✅ 重定向到 `/subscribe`

**预期结果：**
- ✅ 订阅状态检查正确
- ✅ 日志清晰可读

---

## 调试检查清单

### 如果订阅未创建：

1. **检查 Edge Function 日志：**
   - `validate-stripe-session` 函数日志
   - 查找错误消息

2. **检查 Webhook 日志：**
   - `stripe-webhook` 函数日志
   - 确认 webhook 事件已处理

3. **检查数据库：**
   - 确认 RLS 策略允许插入
   - 确认字段类型匹配

4. **检查 Stripe Dashboard：**
   - 确认支付成功
   - 确认 webhook 事件已发送

### 如果出现重定向循环：

1. **检查 Middleware：**
   - 确认 `session_id` 检查逻辑正确
   - 确认 `.maybeSingle()` 使用正确

2. **检查 Dashboard 页面：**
   - 确认重定向逻辑正确
   - 确认使用 `router.replace()` 而不是 `window.location.href`

3. **检查浏览器控制台：**
   - 查找错误消息
   - 检查网络请求

---

## 常见问题排查

### 问题 1: Webhook 签名验证失败
**症状：** Edge Function 日志显示签名验证错误

**解决：**
1. 确认 `STRIPE_WEBHOOK_SECRET` 与 Stripe Dashboard 中的 signing secret 完全一致
2. 确认没有多余空格或换行
3. 重新复制 signing secret 并更新

### 问题 2: 订阅创建但前端检测不到
**症状：** 数据库中有订阅，但前端仍重定向到 `/subscribe`

**解决：**
1. 检查 RLS 策略：用户应该能 `SELECT` 自己的订阅
2. 检查查询条件：确认 `status` 检查包含 `'active'` 和 `'trialing'`
3. 清除浏览器缓存并重新登录

### 问题 3: 重定向循环
**症状：** 页面不断重定向

**解决：**
1. 检查 Middleware 逻辑
2. 检查 Dashboard layout 和 page 组件
3. 确认 `session_id` 处理正确

---

## 成功标准 ✅

测试完成后，应该满足：

- ✅ 新用户订阅流程完整无错误
- ✅ Webhook 正确处理所有事件
- ✅ 已订阅用户正确访问 dashboard
- ✅ 未订阅用户正确重定向
- ✅ 无重定向循环
- ✅ 数据库记录完整准确
- ✅ 无控制台错误
- ✅ 日志清晰可读

---

**开始测试：** 运行 `pnpm dev` 并按照上述步骤测试

