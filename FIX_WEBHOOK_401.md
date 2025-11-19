# 修复 Stripe Webhook 401 错误

## 问题
Stripe webhook 事件返回 401 Unauthorized 错误，这是因为 Supabase Edge Functions 默认需要 JWT 认证。

## 解决方案

### 方法 1：在 Supabase Dashboard 中配置（推荐）

1. 访问 Supabase Dashboard：
   https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions

2. 找到 `stripe-webhook` 函数

3. 点击函数名称进入详情页

4. 在函数设置中找到 **"Authentication"** 或 **"Security"** 选项

5. 将认证模式设置为 **"Public"** 或 **"No Authentication Required"**

6. 保存设置

### 方法 2：使用 Supabase CLI（如果支持）

```bash
# 更新函数配置为不需要认证
supabase functions update stripe-webhook --no-verify-jwt --project-ref wqinxqlsmoroqgqpdjfk
```

### 方法 3：检查 Stripe Webhook 端点配置

确保 Stripe Dashboard 中的 webhook 端点 URL 正确：
```
https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook
```

## 验证修复

1. 在 Stripe Dashboard 中发送一个测试事件
2. 检查 Supabase Edge Functions 日志，应该看到 200 状态码而不是 401
3. 检查数据库中的订阅记录是否正确更新

## 注意事项

- Webhook 函数必须设置为公开访问，因为 Stripe 无法提供 Supabase JWT token
- 安全性由 Stripe webhook 签名验证保证（代码中已实现）
- 确保 `STRIPE_WEBHOOK_SECRET` 环境变量已正确配置

