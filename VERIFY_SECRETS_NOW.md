# ✅ 步骤 4: 验证 Secrets 是否正确加载

## 🎉 部署已完成！

函数已重新部署。现在需要验证 secrets 是否正确加载。

## 📋 验证方法

### 方法 1: 查看函数日志（推荐）

1. **访问函数日志页面**：
   https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs

2. **触发一次订阅请求**：
   - 在你的应用中点击 "Subscribe Now" 按钮
   - 或者刷新订阅页面并尝试订阅

3. **查看最新的日志条目**，应该看到：
   ```
   Stripe key check: {
     hasSTRIPE_SECRET_KEY: true,
     keyLength: 100+,
     keyPrefix: "sk_test_...",
     startsWithSk: true,
     hasWhitespace: false
   }
   ```

4. **如果看到这些值**：
   - ✅ `hasSTRIPE_SECRET_KEY: true` → Secret 已正确加载！
   - ✅ `keyLength: 100+` → Key 完整
   - ✅ `startsWithSk: true` → 格式正确

### 方法 2: 使用测试函数

1. **获取你的 Supabase anon key**：
   - 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/settings/api
   - 复制 "anon public" key

2. **调用测试函数**：
   ```bash
   curl -X POST \
     'https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/test-secret' \
     -H 'Authorization: Bearer YOUR_ANON_KEY_HERE' \
     -H 'Content-Type: application/json'
   ```

3. **预期响应**：
   ```json
   {
     "exists": true,
     "length": 107,
     "prefix": "sk_test_51Q...",
     "startsWithSk": true,
     "startsWithSkTest": true,
     "hasWhitespace": false,
     "isValidFormat": true,
     "status": "✅ Valid",
     "availableStripeEnvVars": [
       "STRIPE_SECRET_KEY",
       "STRIPE_WEBHOOK_SECRET",
       "STRIPE_PRICE_ID"
     ]
   }
   ```

### 方法 3: 测试订阅功能

1. **启动你的应用**（如果还没启动）：
   ```bash
   pnpm dev
   ```

2. **访问订阅页面**

3. **点击 "Subscribe Now" 按钮**

4. **预期结果**：
   - ✅ 成功重定向到 Stripe Checkout 页面
   - ✅ 没有错误信息

5. **如果仍然有错误**：
   - 查看浏览器控制台的错误信息
   - 查看函数日志中的详细错误

## 🔍 如果 Secrets 仍然无法加载

### 检查清单

- [ ] 在 Dashboard 中确认所有 4 个 secrets 都存在
- [ ] 确认 secrets 名称完全匹配（大小写敏感）
- [ ] 确认 secrets 值正确（没有前后空格）
- [ ] 等待了足够的时间（30-60 秒）让部署生效
- [ ] 刷新了 Dashboard 页面

### 常见问题

#### 问题 1: `hasSTRIPE_SECRET_KEY: false`

**原因**: Secret 未正确传递到函数

**解决**:
1. 检查 Dashboard 中 secret 是否存在
2. 确认名称完全匹配：`STRIPE_SECRET_KEY`
3. 重新部署函数
4. 等待更长时间（60 秒）

#### 问题 2: `keyLength: 0` 或值太短

**原因**: Secret 值为空或被截断

**解决**:
1. 在 Dashboard 中检查 secret 值
2. 重新设置完整的值
3. 确保复制时没有截断

#### 问题 3: `startsWithSk: false`

**原因**: 使用了错误的 key（可能是 Publishable Key）

**解决**:
1. 确认使用的是 Secret Key（`sk_test_...`），不是 Publishable Key（`pk_test_...`）
2. 从 Stripe Dashboard 重新获取正确的 key

## ✅ 成功标志

如果看到以下情况，说明一切正常：

- ✅ 函数日志显示 `hasSTRIPE_SECRET_KEY: true`
- ✅ 函数日志显示 `keyLength: 100+`
- ✅ 订阅功能可以正常工作
- ✅ 可以成功重定向到 Stripe Checkout

---

**请现在测试订阅功能，然后查看函数日志，告诉我结果！**

