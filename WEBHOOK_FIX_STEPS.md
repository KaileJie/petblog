# 🔧 修复 Stripe Webhook 401 错误 - 具体步骤

## ✅ 已找到你的配置信息

- **Supabase Project**: `wqinxqlsmoroqgqpdjfk`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaW54cWxzbW9yb3FncXBkamZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzM0MDEsImV4cCI6MjA3ODEwOTQwMX0.Ds-h-BYA4cMkJlO1AUmiHC1E0NkIPd1KQYLGmvVqeKs`

## 📝 操作步骤

### 方法 1: 更新 Webhook URL（推荐）

1. **打开 Stripe Dashboard Webhooks 页面**:
   ```
   https://dashboard.stripe.com/test/webhooks
   ```

2. **找到你的 webhook endpoint**，应该显示为:
   ```
   https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook
   ```

3. **点击 "Edit destination" 或编辑按钮**

4. **更新 Endpoint URL 为**:
   ```
   https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook?anon-key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaW54cWxzbW9yb3FncXBkamZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzM0MDEsImV4cCI6MjA3ODEwOTQwMX0.Ds-h-BYA4cMkJlO1AUmiHC1E0NkIPd1KQYLGmvVqeKs
   ```

5. **保存更改**

6. **测试 webhook**:
   - 点击 "Send test event"
   - 选择任意事件类型（如 `checkout.session.completed`）
   - 检查状态应该显示 "Succeeded" ✅

### 方法 2: 使用自定义 Header（如果方法 1 不工作）

1. **在 Stripe webhook 编辑页面**，找到 "Headers" 或 "Additional headers" 部分

2. **添加新的 header**:
   - **Header name**: `Authorization`
   - **Header value**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaW54cWxzbW9yb3FncXBkamZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzM0MDEsImV4cCI6MjA3ODEwOTQwMX0.Ds-h-BYA4cMkJlO1AUmiHC1E0NkIPd1KQYLGmvVqeKs`

3. **保存更改**

## ✅ 验证修复

修复后，你应该看到：
- ✅ Webhook 事件状态从 "401 ERR" 变为 "200 OK" 或 "Succeeded"
- ✅ 订阅数据成功写入数据库
- ✅ 不再有 401 错误

## 🔍 检查日志

如果还有问题，检查：
1. **Supabase Dashboard**: https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions
   - 查看 `stripe-webhook` 函数的日志
   
2. **Stripe Dashboard**: https://dashboard.stripe.com/test/webhooks
   - 查看 webhook 事件的详细响应

## 📌 重要提示

- Anon key 是公开的，可以安全地放在 URL 中
- Webhook 的安全性由 Stripe 签名验证保证
- 只有 Stripe 知道 webhook secret，所以即使 URL 公开也是安全的

