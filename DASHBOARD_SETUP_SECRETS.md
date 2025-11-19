# 通过 Supabase Dashboard 设置 Edge Function Secrets

## ✅ 是的，可以不使用 CLI！

Supabase Edge Functions 的 secrets **应该通过 Dashboard 设置**，这是官方推荐的方式。CLI 设置的 secrets 可能存在同步问题。

## 📋 详细步骤

### 步骤 1: 访问 Secrets 页面

1. 打开 Supabase Dashboard
2. 选择你的项目：`wqinxqlsmoroqgqpdjfk`
3. 左侧菜单：**Edge Functions** → **Secrets**
4. 或者直接访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

### 步骤 2: 设置每个 Secret

在 Secrets 页面，点击 **"Add new secret"** 或编辑现有 secret，设置以下 7 个：

#### 1. STRIPE_SECRET_KEY
- **名称**: `STRIPE_SECRET_KEY`（必须完全匹配，区分大小写）
- **值**: 你的 Stripe Secret Key
  - 获取：https://dashboard.stripe.com/test/apikeys
  - 点击 "Reveal test key"
  - 复制完整值（以 `sk_test_` 开头，通常 100+ 字符）
- **格式**: `sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz...`

#### 2. STRIPE_WEBHOOK_SECRET
- **名称**: `STRIPE_WEBHOOK_SECRET`
- **值**: 你的 Webhook Signing Secret
  - 获取：https://dashboard.stripe.com/test/webhooks
  - 点击你的 webhook endpoint → "Signing secret" → "Reveal"
  - 复制完整值（以 `whsec_` 开头）
- **格式**: `whsec_1234567890abcdef...`

#### 3. STRIPE_PRICE_ID
- **名称**: `STRIPE_PRICE_ID`
- **值**: 你的 Price ID
  - 获取：https://dashboard.stripe.com/test/products
  - 点击你的产品 → 查看 Price ID
  - 或者使用：`price_1SSVzWRx0nbLiT9kqqeHNMBv`
- **格式**: `price_1SSVzWRx0nbLiT9kqqeHNMBv`

#### 4. SUPABASE_URL
- **名称**: `SUPABASE_URL`
- **值**: `https://wqinxqlsmoroqgqpdjfk.supabase.co`
- **获取**: 在 Dashboard → Settings → API → Project URL

#### 5. SUPABASE_ANON_KEY
- **名称**: `SUPABASE_ANON_KEY`
- **值**: 你的 anon/public key
  - 获取：Dashboard → Settings → API → Project API keys → anon/public
  - 复制完整值（JWT token，以 `eyJ` 开头）
- **格式**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### 6. SUPABASE_SERVICE_ROLE_KEY
- **名称**: `SUPABASE_SERVICE_ROLE_KEY`
- **值**: 你的 service_role key
  - 获取：Dashboard → Settings → API → Project API keys → service_role
  - 点击 "Reveal" 显示密钥
  - 复制完整值（JWT token，以 `eyJ` 开头）
- **格式**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- ⚠️ **重要**: 这是敏感密钥，不要暴露

#### 7. SITE_URL
- **名称**: `SITE_URL`
- **值**: 
  - 开发环境: `http://localhost:3000`
  - 生产环境: `https://yourdomain.com`
- **格式**: 有效的 URL，没有尾部斜杠

### 步骤 3: 保存并验证

1. **保存每个 secret**
   - 确保名称完全匹配（区分大小写）
   - 确保值完整且正确
   - 确保没有前后空格

2. **验证所有 secrets 都已设置**
   - 在 Secrets 页面应该看到所有 7 个 secrets
   - 确认名称完全匹配

### 步骤 4: 重新部署函数

设置完所有 secrets 后，重新部署函数：

```bash
supabase functions deploy stripe-checkout
```

或者如果你不想使用 CLI，也可以通过 Dashboard：
- Dashboard → Edge Functions → stripe-checkout → 点击 "Redeploy"

### 步骤 5: 测试

1. 等待几秒钟让部署生效
2. 刷新浏览器页面
3. 再次点击 "Subscribe Now"
4. 查看函数日志确认是否成功

## 🔍 验证 Secrets 是否正确设置

在 Dashboard 的 Secrets 页面，你应该看到：

```
✅ STRIPE_SECRET_KEY
✅ STRIPE_WEBHOOK_SECRET
✅ STRIPE_PRICE_ID
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ SITE_URL
```

## ⚠️ 重要提示

1. **名称必须完全匹配**
   - 代码中使用：`Deno.env.get('STRIPE_SECRET_KEY')`
   - Secret 名称必须是：`STRIPE_SECRET_KEY`（完全一致）

2. **值必须完整**
   - 确保复制完整的 key
   - 不要有前后空格或换行符
   - 确保格式正确（如 `sk_test_` 开头）

3. **Dashboard 是权威来源**
   - CLI 设置的 secrets 可能不会立即生效
   - Dashboard 设置的 secrets 是函数实际使用的

4. **不需要 CLI**
   - 你可以完全通过 Dashboard 管理 secrets
   - CLI 只是可选的工具

## 🆘 如果问题仍然存在

如果 Dashboard 设置后仍然无法访问：

1. **检查函数日志**
   - Dashboard → Edge Functions → stripe-checkout → Logs
   - 查看最新的错误信息

2. **确认 secrets 名称**
   - 在 Dashboard 中双击每个 secret 查看名称
   - 确保与代码中使用的完全匹配

3. **尝试删除并重新添加**
   - 删除旧的 secret
   - 重新添加，确保名称和值都正确

---

**总结：是的，完全可以通过 Dashboard 设置，不需要 CLI！Dashboard 是设置 Edge Function secrets 的标准方式。**

