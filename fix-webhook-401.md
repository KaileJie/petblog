# 修复 Stripe Webhook 401 错误指南

## 问题
Stripe webhook 返回 401 错误，因为 Supabase Edge Function 需要认证。

## 解决方案

### 步骤 1: 获取 Supabase Anon Key

1. 访问 Supabase Dashboard:
   https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/settings/api

2. 在 "Project API keys" 部分，找到 **"anon" "public"** key
   - 点击 "Reveal" 或 "Copy" 按钮复制这个 key
   - 格式类似：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 步骤 2: 更新 Stripe Webhook URL

1. 访问 Stripe Dashboard Webhooks 页面:
   https://dashboard.stripe.com/test/webhooks

2. 找到你的 webhook endpoint:
   `https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook`

3. 点击 "Edit destination" 或编辑按钮

4. 更新 URL，添加 `anon-key` 查询参数:
   ```
   https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook?anon-key=YOUR_ANON_KEY_HERE
   ```
   将 `YOUR_ANON_KEY_HERE` 替换为步骤 1 中复制的 anon key

5. 保存更改

### 步骤 3: 验证配置

1. 在 Stripe Dashboard 中，点击 "Send test event" 测试 webhook
2. 检查事件状态，应该显示 "Succeeded" 而不是 "Failed"
3. 检查 Supabase Dashboard 中的函数日志，确认事件被正确处理

## 替代方案：使用自定义 Header（如果 URL 方法不工作）

如果添加查询参数不工作，可以在 Stripe webhook 配置中添加自定义 header:

1. 在 Stripe webhook 编辑页面，找到 "Headers" 部分
2. 添加新的 header:
   - **Header name**: `Authorization`
   - **Header value**: `Bearer YOUR_ANON_KEY_HERE`
   （替换为你的 anon key）

## 当前 Webhook URL
```
https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook
```

## 更新后的 Webhook URL（示例）
```
https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook?anon-key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaW54cWxzbW9yb3FncHFkamZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1Njg4MDAsImV4cCI6MjA1MDE0NDgwMH0.xxxxx
```

## 注意事项

- ⚠️ Anon key 是公开的，可以安全地放在 URL 中
- ✅ Webhook 仍然通过 Stripe 签名验证来保证安全性
- ✅ 只有 Stripe 知道 webhook secret，所以即使 URL 公开也是安全的

