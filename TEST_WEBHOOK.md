# 🧪 测试 Stripe Webhook 修复

## ✅ 步骤 1: 在 Stripe Dashboard 测试 Webhook

1. **访问 Stripe Dashboard Webhooks**:
   https://dashboard.stripe.com/test/webhooks

2. **找到你的 webhook endpoint**，点击它

3. **点击 "Send test event" 按钮**

4. **选择一个测试事件**，例如：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `invoice.payment_succeeded`

5. **检查结果**:
   - ✅ 应该显示 "Succeeded" 或 "200 OK"
   - ❌ 如果还是 "401 ERR"，检查 URL 是否正确更新

## ✅ 步骤 2: 检查 Supabase 日志

1. **访问 Supabase Dashboard**:
   https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions

2. **点击 `stripe-webhook` 函数**

3. **查看日志**，应该看到：
   - ✅ "Webhook verified: [event_type] [event_id]"
   - ✅ 没有 401 错误
   - ✅ 事件处理成功的日志

## ✅ 步骤 3: 测试完整订阅流程

1. **访问你的网站**:
   ```
   http://localhost:3000/subscribe
   ```

2. **点击 "Subscribe Now"**

3. **完成 Stripe Checkout**（使用测试卡号）:
   - 卡号: `4242 4242 4242 4242`
   - 过期日期: 任何未来日期
   - CVC: 任意 3 位数字

4. **检查结果**:
   - ✅ 应该成功重定向到 dashboard
   - ✅ 不应该看到 "Verification Failed" 错误
   - ✅ 订阅应该成功创建

## ✅ 步骤 4: 验证数据库

1. **访问 Supabase Dashboard**:
   https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/editor

2. **打开 `subscriptions` 表**

3. **检查是否有新记录**:
   - ✅ 应该有新的订阅记录
   - ✅ `status` 应该是 `active`
   - ✅ `stripe_subscription_id` 应该有值

## 🔍 如果还有问题

如果 webhook 仍然返回 401：

1. **检查 URL 是否正确**:
   - 确保 URL 包含 `?anon-key=...`
   - 确保 anon key 完整（没有截断）

2. **尝试使用 Header 方法**:
   - 在 Stripe webhook 配置中添加 Header
   - Header name: `Authorization`
   - Header value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaW54cWxzbW9yb3FncXBkamZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzM0MDEsImV4cCI6MjA3ODEwOTQwMX0.Ds-h-BYA4cMkJlO1AUmiHC1E0NkIPd1KQYLGmvVqeKs`

3. **检查 Supabase 函数日志**:
   - 查看具体的错误信息
   - 确认函数是否正确部署

