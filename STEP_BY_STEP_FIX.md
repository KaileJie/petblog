# 🔧 逐步修复指南

## ✅ 步骤 1: 取消设置 CLI Secrets - 已完成

我们已经尝试取消设置 CLI secrets。有些可能已经不存在了，这没关系。

## 📋 步骤 2: 在 Dashboard 中设置 Secrets

现在需要在 Dashboard 中手动添加这些 secrets。

### 2.1 访问 Dashboard Secrets 页面

打开浏览器，访问：
**https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets**

### 2.2 添加每个 Secret

#### 🔑 STRIPE_SECRET_KEY

1. 点击 "Add new secret" 按钮
2. **名称**: `STRIPE_SECRET_KEY`（完全匹配，全大写，没有空格）
3. **值**: 
   - 访问：https://dashboard.stripe.com/test/apikeys
   - 找到 "Secret key"（不是 Publishable key）
   - 点击 "Reveal test key"
   - 复制完整值（应该以 `sk_test_` 开头，约 100+ 字符）
   - 粘贴到值字段（确保前后没有空格）
4. 点击 "Save"

#### 🔑 STRIPE_WEBHOOK_SECRET

1. 点击 "Add new secret" 按钮
2. **名称**: `STRIPE_WEBHOOK_SECRET`
3. **值**: 
   - 访问：https://dashboard.stripe.com/test/webhooks
   - 点击你的 webhook endpoint
   - 复制 "Signing secret"（应该以 `whsec_` 开头）
   - 粘贴到值字段
4. 点击 "Save"

#### 🔑 STRIPE_PRICE_ID

1. 点击 "Add new secret" 按钮
2. **名称**: `STRIPE_PRICE_ID`
3. **值**: 
   - 访问：https://dashboard.stripe.com/test/products
   - 点击你的产品
   - 复制 "Price ID"（应该以 `price_` 开头）
   - 粘贴到值字段
4. 点击 "Save"

#### 🔑 SITE_URL

1. 点击 "Add new secret" 按钮
2. **名称**: `SITE_URL`
3. **值**: 
   - 开发环境：`http://localhost:3000`
   - 生产环境：`https://yourdomain.com`
4. 点击 "Save"

### 2.3 验证 Secrets 已添加

在 Dashboard secrets 列表中，确认看到：
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `STRIPE_PRICE_ID`
- ✅ `SITE_URL`

**重要**: 现在这些 secrets 应该可以编辑了（不再显示"保留的"）。

## 📋 步骤 3: 重新部署函数

完成 Dashboard 设置后，运行以下命令：

```bash
cd /Users/dallylovely/Desktop/Jie/AI/PetBlog/petblog

# 部署 stripe-checkout
supabase functions deploy stripe-checkout

# 部署 stripe-webhook
supabase functions deploy stripe-webhook

# 部署 test-secret（用于验证）
supabase functions deploy test-secret
```

## 📋 步骤 4: 验证 Secrets 是否正确加载

### 方法 1: 查看函数日志

1. 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs

2. 在你的应用中触发一次订阅请求（点击 "Subscribe Now"）

3. 查看最新的日志条目，应该看到：
   ```
   Stripe key check: {
     hasSTRIPE_SECRET_KEY: true,
     keyLength: 100+,
     keyPrefix: "sk_test_...",
     startsWithSk: true,
     hasWhitespace: false
   }
   ```

### 方法 2: 使用测试函数

1. 获取你的 Supabase anon key：
   - 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/settings/api
   - 复制 "anon public" key

2. 调用测试函数：
   ```bash
   curl -X POST \
     'https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/test-secret' \
     -H 'Authorization: Bearer YOUR_ANON_KEY_HERE' \
     -H 'Content-Type: application/json'
   ```

3. 应该看到：
   ```json
   {
     "exists": true,
     "length": 107,
     "prefix": "sk_test_51Q...",
     "startsWithSk": true,
     "isValidFormat": true,
     "status": "✅ Valid"
   }
   ```

## ✅ 完成检查清单

- [ ] 步骤 1: CLI secrets 已取消设置
- [ ] 步骤 2: 在 Dashboard 中添加了所有 4 个 secrets
- [ ] 步骤 2: Secrets 现在可以编辑（不再显示"保留的"）
- [ ] 步骤 3: 函数已重新部署
- [ ] 步骤 4: 函数日志显示 `hasSTRIPE_SECRET_KEY: true`
- [ ] 步骤 4: 订阅功能正常工作

## 🆘 如果仍然有问题

如果 secrets 仍然显示为"保留的"：

1. **等待更长时间**（30-60 秒）让取消设置操作完全生效
2. **刷新 Dashboard 页面**
3. **如果还是不行**，可能需要联系 Supabase 支持

---

**现在请完成步骤 2（在 Dashboard 中添加 secrets），然后告诉我结果！**

