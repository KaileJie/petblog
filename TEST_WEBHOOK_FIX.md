# 🧪 测试 Webhook 修复 - "No subscription found" 错误

## 📋 修复内容

修复了 `customer.subscription.updated` 事件处理中，当 subscription 记录不存在时的错误处理逻辑。现在会：
1. 从 Stripe 获取 subscription 信息
2. 从 subscription metadata 或 customer metadata 中提取 `user_id`
3. 自动创建 subscription 记录（使用 upsert）

## 🚀 测试步骤

### 步骤 1: 重新部署 Edge Function

```bash
cd petblog
supabase functions deploy stripe-webhook
```

**或者通过 Supabase Dashboard:**
1. 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions
2. 找到 `stripe-webhook` 函数
3. 点击 "Deploy" 或等待自动部署（如果已启用自动部署）

### 步骤 2: 使用新账号测试订阅流程

1. **创建新测试账号**
   - 访问你的网站注册页面
   - 使用新的邮箱注册（例如：`test-new-account@example.com`）

2. **完成订阅流程**
   - 访问 `/subscribe` 页面
   - 点击 "Subscribe Now"
   - 使用 Stripe 测试卡完成支付：
     - 卡号：`4242 4242 4242 4242`
     - 过期日期：任意未来日期（如 `12/25`）
     - CVC：任意 3 位数字（如 `123`）
     - 邮编：任意邮编（如 `12345`）

3. **等待 webhook 事件处理**
   - 通常需要几秒钟时间
   - Stripe 会发送多个 webhook 事件：
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `invoice.payment_succeeded`

### 步骤 3: 检查 Supabase Edge Functions 日志

1. **访问 Supabase Dashboard**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions

2. **查看 `stripe-webhook` 函数日志**
   - 点击 `stripe-webhook` 函数
   - 切换到 "Logs" 标签
   - 查看最新的日志条目

3. **验证修复是否生效**
   
   ✅ **应该看到（正常情况）：**
   ```
   Creating missing subscription record for sub_xxx with user_id xxx
   ```
   或
   ```
   ✅ Subscription created/updated successfully
   ```

   ❌ **不应该看到（错误情况）：**
   ```
   No subscription found: sub_xxx
   ```
   或
   ```
   Error: No subscription found
   ```

### 步骤 4: 验证数据库记录

1. **访问 Supabase Dashboard**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/editor

2. **检查 `subscriptions` 表**
   - 打开 `subscriptions` 表
   - 应该能看到新创建的订阅记录
   - 检查字段：
     - `user_id` - 应该匹配测试账号的用户 ID
     - `stripe_subscription_id` - 应该以 `sub_` 开头
     - `status` - 应该是 `active`
     - `stripe_customer_id` - 应该以 `cus_` 开头

### 步骤 5: 测试边缘情况（可选）

#### 测试 A: 手动触发 `customer.subscription.updated` 事件

1. **在 Stripe Dashboard 中**
   - 访问：https://dashboard.stripe.com/test/webhooks
   - 找到你的 webhook endpoint
   - 点击 "Send test event"
   - 选择 `customer.subscription.updated`
   - 输入一个已存在的 subscription ID（从数据库或之前的测试中获取）

2. **检查日志**
   - 应该看到成功更新的日志
   - 不应该看到 "No subscription found" 错误

#### 测试 B: 检查事件顺序

即使 `customer.subscription.updated` 事件在 `checkout.session.completed` 之前到达，也应该能正常处理。

## 🔍 调试技巧

### 查看详细日志

在 Supabase Dashboard 的 Edge Functions 日志中，查找以下关键词：

- `Creating missing subscription record` - 表示自动创建了缺失的记录
- `No subscription found and no user_id in metadata` - 警告：找不到 user_id（这种情况应该很少见）
- `Error upserting subscription` - 数据库操作错误

### 检查 metadata

如果仍然出现问题，检查 Stripe 中的 metadata：

1. **检查 Subscription metadata**
   - Stripe Dashboard → Customers → 选择客户 → Subscriptions
   - 点击 subscription → 查看 metadata
   - 应该看到 `supabase_user_id`

2. **检查 Customer metadata**
   - Stripe Dashboard → Customers → 选择客户
   - 查看 metadata
   - 应该看到 `supabase_user_id`

## ✅ 成功标准

测试成功的标志：

- ✅ 新账号订阅流程完整无错误
- ✅ Edge Functions 日志中没有 "No subscription found" 错误
- ✅ 数据库中正确创建了 subscription 记录
- ✅ 所有 webhook 事件都能正常处理
- ✅ 即使事件顺序不同，也能正确处理

## 🚨 如果还有问题

如果仍然看到 "No subscription found" 错误：

1. **检查 metadata 是否正确设置**
   - 确认 `stripe-checkout` 函数正确设置了 metadata
   - 检查 Stripe Dashboard 中的 subscription 和 customer metadata

2. **检查日志中的完整错误信息**
   - 查看是否有其他相关错误
   - 检查是否有权限问题

3. **验证代码已正确部署**
   - 确认最新的代码已部署到 Supabase
   - 可以查看函数的 "Source" 标签确认代码版本

4. **检查 Stripe webhook 配置**
   - 确认 webhook endpoint URL 正确
   - 确认 webhook secret 匹配

---

**测试完成后，如果一切正常，Edge Functions 日志应该不再出现 "No subscription found" 错误！** 🎉

