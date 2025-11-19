# 🔧 订阅流程修复

## 问题

用户付完钱后，返回到订阅界面，仍然显示 "Subscribe Now"，陷入循环。

## 已修复

### 1. 订阅页面现在会检查订阅状态

修改了 `app/subscribe/page.tsx`：
- ✅ 页面加载时检查用户是否已有活跃订阅
- ✅ 如果已订阅，显示 "You're Already Subscribed!" 并自动重定向到 dashboard
- ✅ 如果没有订阅，显示订阅按钮

### 2. 订阅流程

1. **用户点击 "Subscribe Now"**
   - 创建 Stripe Checkout Session
   - 重定向到 Stripe Checkout

2. **用户完成支付**
   - Stripe 发送 webhook 到 `stripe-webhook` 函数
   - Webhook 更新数据库中的订阅记录

3. **用户返回应用**
   - 如果从 Stripe 返回时有 `session_id`，dashboard 页面会验证订阅
   - 订阅页面会检查订阅状态，如果已订阅则重定向到 dashboard

## 验证步骤

### 1. 检查 Webhook 是否正确配置

1. **访问 Stripe Dashboard**:
   https://dashboard.stripe.com/test/webhooks

2. **确认 webhook endpoint 已配置**:
   - URL: `https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook`
   - 事件: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

3. **测试 webhook**:
   - 在 Stripe Dashboard 中点击 "Send test webhook"
   - 选择 `checkout.session.completed` 事件
   - 查看 Supabase 函数日志确认 webhook 被接收

### 2. 检查数据库订阅记录

在 Supabase Dashboard 中检查 `subscriptions` 表：
- https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/editor

查看是否有用户的订阅记录，状态应该是 `active` 或 `trialing`。

### 3. 测试完整流程

1. **清除测试数据**（如果需要）:
   ```sql
   -- 在 Supabase SQL Editor 中运行
   DELETE FROM subscriptions WHERE user_id = 'YOUR_USER_ID';
   ```

2. **测试订阅流程**:
   - 访问 `/subscribe`
   - 点击 "Subscribe Now"
   - 完成支付（使用 Stripe 测试卡：4242 4242 4242 4242）
   - 返回应用

3. **验证结果**:
   - 应该看到 "Welcome to PetBlog Premium!" 或重定向到 dashboard
   - 再次访问 `/subscribe` 应该显示 "You're Already Subscribed!"

## 如果问题仍然存在

### 检查 Webhook 日志

1. **查看 webhook 函数日志**:
   https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-webhook/logs

2. **查找错误信息**:
   - Webhook 签名验证失败
   - 数据库更新失败
   - 用户 ID 不匹配

### 检查数据库权限

确保 `subscriptions` 表有正确的 RLS (Row Level Security) 策略：
- 用户可以读取自己的订阅记录
- Service role 可以插入/更新订阅记录

### 手动测试 Webhook

使用 Stripe CLI 测试 webhook：
```bash
stripe listen --forward-to https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

---

**现在请测试订阅流程，告诉我结果！**

