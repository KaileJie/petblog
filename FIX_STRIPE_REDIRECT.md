# 🔧 修复 Stripe Checkout 重定向到 Localhost

## 🎯 问题

订阅完成后，Stripe 重定向到 `localhost:3000` 而不是生产网站。

**原因**: Supabase Edge Function `stripe-checkout` 中的 `SITE_URL` secret 未配置，代码回退到默认值 `http://localhost:3000`。

## ✅ 解决方案

在 Supabase Dashboard 中为 pro 项目配置 `SITE_URL` secret。

### 步骤 1: 配置 Supabase Edge Function Secret

1. **访问 Supabase Dashboard**
   - 打开: https://supabase.com/dashboard/project/mqfxxnjudwtqgvxtzbso/settings/functions

2. **添加 SITE_URL Secret**
   - 在 "Secrets" 部分
   - 点击 "Add new secret"
   - **Name**: `SITE_URL`
   - **Value**: `https://pawstories.vercel.app`
   - 点击 "Save"

### 步骤 2: 验证配置

运行以下命令检查 secret 是否已设置：

```bash
cd petblog
supabase secrets list --project-ref mqfxxnjudwtqgvxtzbso
```

应该看到 `SITE_URL` 在列表中。

### 步骤 3: 重新部署 Edge Function（如果需要）

虽然通常不需要，但如果修改了代码，可以重新部署：

```bash
cd petblog
supabase functions deploy stripe-checkout --project-ref mqfxxnjudwtqgvxtzbso
```

## 📋 代码位置

在 `supabase/functions/stripe-checkout/index.ts` 第197行：

```typescript
const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000'
```

当 `SITE_URL` secret 未设置时，会使用默认值 `http://localhost:3000`。

## ✅ 验证步骤

1. **配置 SITE_URL secret** 后等待几秒钟
2. **测试订阅流程**:
   - 访问: https://pawstories.vercel.app/subscribe
   - 完成 Stripe Checkout
   - 检查重定向 URL - 应该指向 `https://pawstories.vercel.app/dashboard?session_id=...`
   - 不应该再看到 `localhost`

## 🔍 相关配置

### Pro项目需要的所有 Secrets

确保以下 secrets 都已配置：

| Secret | 值 | 说明 |
|--------|-----|------|
| `SITE_URL` | `https://pawstories.vercel.app` | ⚠️ **需要添加** |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe 生产密钥 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe webhook 签名密钥 |

### 检查所有 Secrets

```bash
supabase secrets list --project-ref mqfxxnjudwtqgvxtzbso
```

## 🐛 故障排除

### 如果重定向仍然是 localhost:

1. **确认 secret 已保存**:
   - 检查 Dashboard → Settings → Edge Functions → Secrets
   - 确认 `SITE_URL` 存在且值为 `https://pawstories.vercel.app`

2. **检查 Edge Function 日志**:
   - Dashboard → Edge Functions → stripe-checkout → Logs
   - 查看是否有错误信息

3. **清除浏览器缓存**:
   - 使用无痕模式测试
   - 或清除浏览器缓存

4. **等待配置生效**:
   - Secret 配置可能需要几秒钟才能生效
   - 如果还是不行，等待1-2分钟再试

## 📚 相关文档

- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)
- [Stripe Checkout Session](https://stripe.com/docs/api/checkout/sessions/create)

