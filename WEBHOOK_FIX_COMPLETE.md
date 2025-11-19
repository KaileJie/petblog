# ✅ Webhook 401 错误已修复

## 🔍 问题原因

Supabase Edge Functions **默认需要 JWT 验证**，但 Stripe webhook 请求不包含 JWT token，所以返回 401 错误。

## ✅ 已完成的修复

1. ✅ 使用 `--no-verify-jwt` 标志重新部署了 `stripe-webhook` 函数
2. ✅ 函数现在可以接受无认证的请求（安全性由 Stripe 签名验证保证）

## 📝 现在需要做的

### 更新 Stripe Webhook URL（简化）

由于函数现在不需要认证，你可以**移除 URL 中的 `anon-key` 参数**：

**之前的 URL（可以保留，但不必要）**:
```
https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook?anon-key=...
```

**简化后的 URL（推荐）**:
```
https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook
```

### 操作步骤

1. **访问 Stripe Dashboard**:
   https://dashboard.stripe.com/test/webhooks

2. **找到你的 webhook endpoint**，点击 "Edit destination"

3. **更新 Endpoint URL 为**:
   ```
   https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook
   ```
   （移除 `?anon-key=...` 部分）

4. **保存更改**

## 🧪 测试

1. **在 Stripe Dashboard 点击 "Send test event"**
2. **选择 `checkout.session.completed`**
3. **检查状态**:
   - ✅ 应该显示 "Succeeded" 或 "200 OK"
   - ❌ 如果还是 401，等待几秒钟让部署生效，然后重试

## 🔒 安全性说明

- ✅ Webhook 仍然安全：通过 Stripe 签名验证保证
- ✅ 只有 Stripe 知道 webhook secret
- ✅ 即使函数公开访问，也只有 Stripe 可以发送有效请求
- ✅ 移除了不必要的 JWT 验证，简化了配置

## 📊 验证修复

修复后，你应该看到：
- ✅ Webhook 事件状态从 "401 ERR" 变为 "200 OK"
- ✅ 订阅数据成功写入数据库
- ✅ 不再有认证错误

