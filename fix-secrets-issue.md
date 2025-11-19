# 修复 STRIPE_SECRET_KEY 无法访问的问题

## 问题
函数日志显示：`STRIPE_SECRET_KEY is not configured`，即使 secrets 已通过 CLI 设置。

## 解决方案

### 方法 1: 通过 Supabase Dashboard 设置（推荐）

Supabase Edge Functions 的 secrets 必须通过 Dashboard 设置才能被函数访问。

1. **访问 Secrets 页面**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

2. **添加或更新每个 Secret**
   - 点击 "Add new secret" 或编辑现有 secret
   - 确保名称完全匹配（区分大小写）
   - 输入完整值（没有前后空格）

3. **必需的 Secrets 列表**
   ```
   STRIPE_SECRET_KEY = sk_test_... (你的 Stripe Secret Key)
   STRIPE_WEBHOOK_SECRET = whsec_... (你的 Webhook Secret)
   STRIPE_PRICE_ID = price_... (你的 Price ID)
   SUPABASE_URL = https://wqinxqlsmoroqgqpdjfk.supabase.co
   SUPABASE_ANON_KEY = eyJ... (你的 anon key)
   SUPABASE_SERVICE_ROLE_KEY = eyJ... (你的 service_role key)
   SITE_URL = http://localhost:3000
   ```

4. **保存后重新部署函数**
   ```bash
   supabase functions deploy stripe-checkout
   ```

### 方法 2: 通过 Supabase CLI 重新设置

如果 Dashboard 中已有 secrets，尝试删除并重新设置：

```bash
# 删除旧的 secret
supabase secrets unset STRIPE_SECRET_KEY

# 重新设置（确保值完整且正确）
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_COMPLETE_KEY_HERE

# 重新部署函数
supabase functions deploy stripe-checkout
```

### 方法 3: 验证 Secrets 是否正确设置

```bash
# 列出所有 secrets（不显示值）
supabase secrets list

# 应该看到所有 7 个 secrets
```

## 重要提示

1. **Secrets 必须在 Dashboard 中设置**
   - CLI 设置的 secrets 可能不会立即生效
   - Dashboard 是设置 secrets 的权威来源

2. **名称必须完全匹配**
   - 代码中使用：`Deno.env.get('STRIPE_SECRET_KEY')`
   - Secret 名称必须是：`STRIPE_SECRET_KEY`（完全一致）

3. **值必须完整**
   - 确保复制完整的 Stripe Secret Key
   - 不要有前后空格或换行符
   - 确保以 `sk_test_` 或 `sk_live_` 开头

4. **重新部署函数**
   - 设置或更新 secrets 后，必须重新部署函数
   - 等待几秒钟让部署生效

## 验证步骤

1. **在 Dashboard 中确认所有 secrets 已设置**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

2. **重新部署函数**
   ```bash
   supabase functions deploy stripe-checkout
   ```

3. **等待部署完成**（通常几秒钟）

4. **测试订阅功能**
   - 刷新浏览器
   - 点击 "Subscribe Now"
   - 查看函数日志确认错误是否解决

## 如果问题仍然存在

如果通过 Dashboard 设置后仍然无法访问：

1. **检查函数日志中的调试信息**
   - 应该看到 `Stripe key check:` 显示 key 是否存在
   - 如果显示 `hasSTRIPE_SECRET_KEY: false`，说明 secret 仍未正确设置

2. **尝试通过 Supabase API 设置**
   - 可能需要使用 Supabase Management API
   - 或者联系 Supabase 支持

3. **检查项目权限**
   - 确保你有权限设置 secrets
   - 检查项目设置

## 获取正确的 Stripe Secret Key

1. 访问：https://dashboard.stripe.com/test/apikeys
2. 找到 "Secret key"
3. 点击 "Reveal test key"
4. 复制完整值（以 `sk_test_` 开头，通常 100+ 字符）
5. 确保没有多余的空格

---

**请优先使用方法 1（通过 Dashboard 设置），这是最可靠的方式！**

