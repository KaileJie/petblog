# Edge Function Secrets 验证清单

请在 Supabase Dashboard 中检查以下 secrets：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

## 必需 Secrets 检查清单

### ✅ 1. STRIPE_SECRET_KEY
- **名称**: `STRIPE_SECRET_KEY` (必须完全匹配，区分大小写)
- **格式**: 
  - 测试环境: `sk_test_51...` (以 `sk_test_` 开头)
  - 生产环境: `sk_live_51...` (以 `sk_live_` 开头)
- **长度**: 通常 100+ 字符
- **验证**: 
  - ✅ 以 `sk_test_` 或 `sk_live_` 开头
  - ✅ 没有多余的空格或换行符
  - ✅ 完整且未截断

### ✅ 2. STRIPE_WEBHOOK_SECRET
- **名称**: `STRIPE_WEBHOOK_SECRET`
- **格式**: `whsec_...` (以 `whsec_` 开头)
- **长度**: 通常 50+ 字符
- **验证**:
  - ✅ 以 `whsec_` 开头
  - ✅ 没有多余的空格或换行符

### ✅ 3. STRIPE_PRICE_ID
- **名称**: `STRIPE_PRICE_ID`
- **格式**: `price_...` (以 `price_` 开头)
- **示例**: `price_1SSVzWRx0nbLiT9kqqeHNMBv`
- **验证**:
  - ✅ 以 `price_` 开头
  - ✅ 与你的 Stripe Dashboard 中的 Price ID 匹配

### ✅ 4. SUPABASE_URL
- **名称**: `SUPABASE_URL`
- **格式**: `https://wqinxqlsmoroqgqpdjfk.supabase.co`
- **验证**:
  - ✅ 以 `https://` 开头
  - ✅ 包含你的项目 ID: `wqinxqlsmoroqgqpdjfk`
  - ✅ 以 `.supabase.co` 结尾

### ✅ 5. SUPABASE_ANON_KEY
- **名称**: `SUPABASE_ANON_KEY`
- **格式**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT token)
- **长度**: 通常 200+ 字符
- **验证**:
  - ✅ 以 `eyJ` 开头 (base64 编码的 JWT)
  - ✅ 没有多余的空格或换行符
  - ✅ 完整且未截断

### ✅ 6. SUPABASE_SERVICE_ROLE_KEY
- **名称**: `SUPABASE_SERVICE_ROLE_KEY`
- **格式**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT token)
- **长度**: 通常 200+ 字符
- **验证**:
  - ✅ 以 `eyJ` 开头
  - ✅ 与 `SUPABASE_ANON_KEY` 不同
  - ✅ 没有多余的空格或换行符

### ✅ 7. SITE_URL
- **名称**: `SITE_URL`
- **格式**: 
  - 开发环境: `http://localhost:3000`
  - 生产环境: `https://yourdomain.com`
- **验证**:
  - ✅ 是有效的 URL
  - ✅ 没有尾部斜杠 `/`
  - ✅ 开发环境使用 `http://`，生产环境使用 `https://`

## 常见错误

### ❌ 错误 1: 名称不匹配
- **问题**: Secret 名称与代码中使用的不一致
- **示例**: 设置了 `STRIPE_SECRET_KEY` 但代码期望 `STRIPE_SECRET_KEY`
- **解决**: 确保名称完全匹配（区分大小写）

### ❌ 错误 2: 值中有多余空格
- **问题**: Secret 值前后有空格或换行符
- **示例**: ` sk_test_... ` 或 `sk_test_...\n`
- **解决**: 复制值时确保没有多余空格

### ❌ 错误 3: 值不完整
- **问题**: Secret 值被截断
- **示例**: `sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz` (不完整)
- **解决**: 确保复制完整的值

### ❌ 错误 4: 使用了错误的 Key
- **问题**: 使用了 Publishable Key 而不是 Secret Key
- **示例**: `pk_test_...` 而不是 `sk_test_...`
- **解决**: 确保使用 Secret Key (以 `sk_` 开头)

## 验证步骤

1. **打开 Dashboard**
   - 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

2. **逐个检查每个 Secret**
   - 点击每个 secret 查看/编辑
   - 确认名称完全匹配
   - 确认值格式正确

3. **重新部署函数**
   ```bash
   supabase functions deploy stripe-checkout
   ```

4. **测试**
   - 刷新浏览器
   - 再次尝试订阅
   - 查看函数日志确认错误是否解决

## 快速验证命令

如果你想通过 CLI 验证 secrets 是否存在：

```bash
# 列出所有 secrets (不显示值)
supabase secrets list

# 应该看到所有 7 个 secrets
```

## 如果 Secrets 缺失或错误

### 通过 Dashboard 设置：
1. 点击 "Add new secret"
2. 输入名称（必须完全匹配）
3. 输入值（确保完整且正确）
4. 保存

### 通过 CLI 设置：
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
supabase secrets set STRIPE_PRICE_ID=price_YOUR_PRICE_ID_HERE
supabase secrets set SUPABASE_URL=https://wqinxqlsmoroqgqpdjfk.supabase.co
supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
supabase secrets set SITE_URL=http://localhost:3000
```

## 获取正确的值

### Stripe Keys:
- 访问：https://dashboard.stripe.com/test/apikeys
- **Secret Key**: 以 `sk_test_` 开头
- **Webhook Secret**: 在 Webhooks 设置中获取

### Supabase Keys:
- 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/settings/api
- **Project URL**: 在 "Project URL" 部分
- **anon/public key**: 在 "Project API keys" 部分
- **service_role key**: 在 "Project API keys" 部分（点击 "Reveal"）

### Price ID:
- 访问：https://dashboard.stripe.com/test/products
- 点击你的产品 → 查看 Price ID

---

**请按照此清单逐个检查每个 secret，确保名称和值都正确！**

