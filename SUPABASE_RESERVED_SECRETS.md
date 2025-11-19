# Supabase Edge Functions 保留的 Secrets

## 什么是保留的 Secrets？

Supabase Edge Functions **自动提供**一些环境变量，这些变量是**系统保留的**，无法在 Dashboard 中手动编辑或删除。

## 自动提供的保留变量

以下变量由 Supabase 自动提供，**不需要**在 Dashboard 中设置：

### ✅ `SUPABASE_URL`
- **自动提供**：是
- **说明**：您的 Supabase 项目 URL
- **格式**：`https://YOUR_PROJECT_ID.supabase.co`
- **是否可以编辑**：❌ 否（保留变量）

### ✅ `SUPABASE_ANON_KEY`
- **自动提供**：是
- **说明**：Supabase 匿名/公共密钥
- **格式**：JWT token (`eyJ...`)
- **是否可以编辑**：❌ 否（保留变量）

### ✅ `SUPABASE_SERVICE_ROLE_KEY`
- **自动提供**：是（在某些情况下）
- **说明**：Supabase 服务角色密钥（具有完整权限）
- **格式**：JWT token (`eyJ...`)
- **是否可以编辑**：❌ 否（保留变量）

## 需要手动设置的 Secrets

以下变量**必须**在 Supabase Dashboard 中手动设置：

### 🔑 `STRIPE_SECRET_KEY`
- **自动提供**：❌ 否
- **说明**：Stripe API 密钥
- **格式**：`sk_test_...` 或 `sk_live_...`
- **设置位置**：Dashboard → Edge Functions → Secrets

### 🔑 `STRIPE_PRICE_ID`
- **自动提供**：❌ 否
- **说明**：Stripe 订阅价格 ID
- **格式**：`price_...`
- **设置位置**：Dashboard → Edge Functions → Secrets

### 🔑 `STRIPE_WEBHOOK_SECRET`
- **自动提供**：❌ 否
- **说明**：Stripe Webhook 签名密钥
- **格式**：`whsec_...`
- **设置位置**：Dashboard → Edge Functions → Secrets

### 🔑 `SITE_URL`
- **自动提供**：❌ 否
- **说明**：您的网站 URL（用于重定向）
- **格式**：`http://localhost:3000` 或 `https://yourdomain.com`
- **设置位置**：Dashboard → Edge Functions → Secrets

## 为什么会出现 "保留变量" 错误？

当您尝试编辑以下变量时会看到此错误：
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**这是正常的！** 这些变量由 Supabase 自动管理，您不需要（也不能）手动设置它们。

## 解决方案

### ✅ 正确的做法：

1. **不要尝试编辑保留变量**
   - `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY` 会自动提供
   - 代码中可以直接使用 `Deno.env.get('SUPABASE_URL')` 等

2. **只设置需要手动配置的变量**
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
   - `SITE_URL`

3. **检查代码中的使用**
   - 确保代码使用 `Deno.env.get('SUPABASE_URL')` 等来访问保留变量
   - 这些变量在 Edge Functions 运行时自动可用

## 当前项目需要的 Secrets

根据代码，您只需要在 Dashboard 中设置以下 **4 个 secrets**：

1. ✅ `STRIPE_SECRET_KEY` - Stripe API 密钥
2. ✅ `STRIPE_PRICE_ID` - Stripe 价格 ID
3. ✅ `STRIPE_WEBHOOK_SECRET` - Stripe Webhook 密钥
4. ✅ `SITE_URL` - 网站 URL

**不需要设置**（自动提供）：
- ❌ `SUPABASE_URL` - 自动提供
- ❌ `SUPABASE_ANON_KEY` - 自动提供
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - 自动提供

## 参考链接

- [Supabase Edge Functions Secrets 文档](https://supabase.com/docs/guides/functions/secrets)
- [Dashboard Secrets 页面](https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets)

