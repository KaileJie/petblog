# 修复 Edge Function Secrets 问题

## 问题
日志显示：`STRIPE_SECRET_KEY is not configured`，说明函数运行时无法访问环境变量。

## 解决方案

### 方法 1: 通过 Supabase Dashboard 设置（推荐）

1. **访问 Supabase Dashboard**
   - 打开：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/settings/functions

2. **设置 Secrets**
   - 在 "Secrets" 部分，确保以下 secrets 都已设置：
     - `STRIPE_SECRET_KEY` = `sk_test_...` (你的 Stripe Secret Key)
     - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (你的 Webhook Secret)
     - `STRIPE_PRICE_ID` = `price_...` (你的 Price ID)
     - `SUPABASE_URL` = `https://wqinxqlsmoroqgqpdjfk.supabase.co`
     - `SUPABASE_ANON_KEY` = (你的 anon key)
     - `SUPABASE_SERVICE_ROLE_KEY` = (你的 service_role key)
     - `SITE_URL` = `http://localhost:3000` (开发环境) 或你的生产 URL

3. **重新部署函数**
   ```bash
   supabase functions deploy stripe-checkout
   ```

### 方法 2: 通过 CLI 重新设置

如果 Dashboard 中已有 secrets，尝试重新设置：

```bash
# 重新设置 Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# 重新部署函数
supabase functions deploy stripe-checkout
```

### 方法 3: 验证 Secrets 是否正确设置

```bash
# 列出所有 secrets
supabase secrets list

# 确认 STRIPE_SECRET_KEY 存在
# 如果不存在，重新设置：
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

## 重要提示

1. **Secrets 名称必须完全匹配**
   - 代码中使用：`Deno.env.get('STRIPE_SECRET_KEY')`
   - Secret 名称必须是：`STRIPE_SECRET_KEY`（完全一致，区分大小写）

2. **重新部署函数**
   - 设置或更新 secrets 后，必须重新部署函数才能生效

3. **检查 Stripe Key 格式**
   - 测试环境：`sk_test_...`
   - 生产环境：`sk_live_...`
   - 确保 key 完整且正确

## 测试步骤

1. **设置 secrets**（通过 Dashboard 或 CLI）
2. **重新部署函数**：`supabase functions deploy stripe-checkout`
3. **等待几秒钟**让部署生效
4. **刷新浏览器页面**
5. **再次测试订阅流程**
6. **查看函数日志**确认错误是否解决

## 如果问题仍然存在

请检查 Supabase Dashboard 中的函数日志：
- https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs

查看新的调试日志，应该会显示：
- `Stripe key check:` - 显示 key 是否存在
- `Available STRIPE env vars:` - 显示所有可用的 STRIPE 相关环境变量

这将帮助我们确定问题所在。

