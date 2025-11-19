# 🔧 修复订阅错误 - "Edge Function returned a non-2xx status code"

## 🔍 问题诊断

错误信息显示：
- `404` - 资源未找到
- `Edge Function returned a non-2xx status code: {}`

可能的原因：
1. **Edge Function 未部署** - `stripe-checkout` 函数可能没有部署到 Supabase
2. **Profile 不存在** - 新注册的用户可能还没有 profile 记录（已修复）
3. **Secrets 未配置** - Edge Function 需要的环境变量可能未设置

## ✅ 修复步骤

### 步骤 1: 部署 Edge Functions

确保所有 Edge Functions 都已部署：

```bash
cd petblog
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
supabase functions deploy validate-stripe-session
```

**或者通过 Supabase Dashboard:**
1. 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions
2. 检查所有函数是否已部署
3. 如果看到 "Deploy" 按钮，点击部署

### 步骤 2: 验证 Edge Function Secrets

确保所有必需的 secrets 都已配置：

1. **访问 Secrets 页面**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

2. **确认以下 secrets 存在：**
   - ✅ `STRIPE_SECRET_KEY` - Stripe 密钥（以 `sk_test_` 或 `sk_live_` 开头）
   - ✅ `STRIPE_WEBHOOK_SECRET` - Webhook 签名密钥（以 `whsec_` 开头）
   - ✅ `STRIPE_PRICE_ID` - Stripe Price ID（以 `price_` 开头）
   - ✅ `SUPABASE_URL` - Supabase 项目 URL
   - ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service Role 密钥（用于 webhook）
   - ✅ `SUPABASE_ANON_KEY` - Anon 密钥（用于 stripe-checkout）
   - ✅ `SITE_URL` - 网站 URL（可选，默认为 `http://localhost:3000`）

### 步骤 3: 检查 Edge Function 日志

查看 `stripe-checkout` 函数的日志：

1. **访问函数日志**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs

2. **查看最新日志**
   - 查找错误信息
   - 检查是否有 "Profile not found" 或其他错误

### 步骤 4: 测试 Edge Function

使用 Supabase Dashboard 测试函数：

1. **访问函数页面**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout

2. **点击 "Invoke" 或 "Test"**
   - 使用以下测试 payload：
   ```json
   {
     "priceId": "your_price_id_here"
   }
   ```

3. **检查响应**
   - 应该返回 `200 OK` 和 checkout session URL
   - 如果返回错误，查看错误信息

### 步骤 5: 验证用户 Profile

确保新注册的用户有 profile 记录：

1. **访问数据库**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/editor

2. **检查 `profiles` 表**
   - 打开 `profiles` 表
   - 查找你的用户 ID
   - 确认有对应的 profile 记录

3. **如果没有 profile**
   - 检查 `handle_new_user` 触发器是否正常工作
   - 或者手动创建 profile（代码已修复，会自动创建）

## 🔧 代码修复

我已经修复了 `stripe-checkout` 函数，现在会：
- ✅ 自动创建缺失的 profile 记录
- ✅ 提供更详细的错误信息
- ✅ 添加日志以便调试

### 已修复的问题：

1. **Profile 不存在时的处理**
   - 之前：返回 404 错误
   - 现在：自动创建 profile，然后继续

2. **错误信息改进**
   - 添加了详细的错误信息
   - 添加了日志输出

## 🧪 测试步骤

修复后，按以下步骤测试：

1. **重新部署 Edge Function**
   ```bash
   supabase functions deploy stripe-checkout
   ```

2. **清除浏览器缓存**
   - 清除 cookies 和缓存
   - 或者使用无痕模式

3. **重新注册账号**
   - 使用新邮箱注册
   - 等待几秒钟确保 profile 创建完成

4. **尝试订阅**
   - 访问 `/subscribe` 页面
   - 点击 "Subscribe Now"
   - 应该能正常创建 checkout session

5. **检查日志**
   - 查看 Edge Function 日志
   - 确认没有错误

## 🚨 如果仍然有问题

### 检查清单：

- [ ] Edge Functions 已部署
- [ ] 所有 Secrets 已配置
- [ ] 用户已登录（有有效的 session）
- [ ] Profile 记录存在（或会自动创建）
- [ ] Stripe Price ID 正确
- [ ] Stripe Secret Key 正确

### 常见错误和解决方案：

#### 错误：`404 - Function not found`
**解决：** 部署 Edge Function
```bash
supabase functions deploy stripe-checkout
```

#### 错误：`401 - Unauthorized`
**解决：** 确保用户已登录，检查 session 是否有效

#### 错误：`500 - Internal Server Error`
**解决：** 
- 检查 Edge Function 日志
- 确认所有 Secrets 已配置
- 检查 Stripe API 密钥是否正确

#### 错误：`Profile not found`
**解决：** 代码已修复，会自动创建 profile。如果仍然出现，检查 RLS 策略

### 查看详细日志：

1. **浏览器控制台**
   - 打开开发者工具（F12）
   - 查看 Console 标签
   - 查看 Network 标签，检查请求和响应

2. **Supabase Dashboard**
   - Edge Functions → stripe-checkout → Logs
   - 查看详细的错误信息

---

**修复完成后，重新测试订阅流程应该可以正常工作了！** 🎉

