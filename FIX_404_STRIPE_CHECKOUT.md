# 🔧 修复 404 错误 - stripe-checkout Edge Function

## 🔍 问题诊断

错误信息：
- `POST https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-checkout 404 (Not Found)`
- `Edge Function returned a non-2xx status code: {}`

**原因：** `stripe-checkout` Edge Function 未找到或未正确部署。

## ✅ 解决步骤

### 步骤 1: 检查函数是否已部署

1. **访问 Supabase Dashboard**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions

2. **查找 `stripe-checkout` 函数**
   - 在函数列表中查找 `stripe-checkout`
   - 检查状态是否为 "Active" 或 "Deployed"

3. **如果函数不存在或未部署**
   - 继续步骤 2

### 步骤 2: 部署 stripe-checkout 函数

#### 方法 A: 使用 Supabase CLI（推荐）

```bash
cd petblog
supabase functions deploy stripe-checkout
```

**如果遇到认证问题：**
```bash
# 先登录
supabase login

# 然后链接项目（如果需要）
supabase link --project-ref wqinxqlsmoroqgqpdjfk

# 部署函数
supabase functions deploy stripe-checkout
```

#### 方法 B: 通过 Supabase Dashboard

1. **访问函数页面**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions

2. **创建新函数（如果不存在）**
   - 点击 "Create a new function"
   - 函数名称：`stripe-checkout`
   - 复制 `supabase/functions/stripe-checkout/index.ts` 的内容
   - 粘贴到编辑器
   - 点击 "Deploy"

3. **或者更新现有函数**
   - 找到 `stripe-checkout` 函数
   - 点击 "Edit"
   - 确保代码是最新的
   - 点击 "Deploy"

### 步骤 3: 验证函数名称

确保函数名称完全匹配：

- ✅ 代码中调用：`'stripe-checkout'`
- ✅ 文件夹名称：`stripe-checkout`
- ✅ 部署的函数名称：`stripe-checkout`（必须完全一致）

**注意：** 函数名称区分大小写，必须是 `stripe-checkout`（小写，中间有连字符）。

### 步骤 4: 检查函数 URL

部署后，函数应该可以通过以下 URL 访问：
```
https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-checkout
```

**测试方法：**
1. 在浏览器中访问上述 URL（会返回错误，但可以确认函数存在）
2. 或者使用 curl：
```bash
curl -X POST https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-checkout \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

如果返回 401（Unauthorized）而不是 404，说明函数存在。

### 步骤 5: 验证 Secrets 配置

确保所有必需的 secrets 已配置：

1. **访问 Secrets 页面**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

2. **确认以下 secrets 存在：**
   - ✅ `STRIPE_SECRET_KEY`
   - ✅ `STRIPE_PRICE_ID`
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_ANON_KEY`
   - ✅ `SITE_URL`（可选）

### 步骤 6: 检查函数日志

部署后，查看函数日志：

1. **访问函数日志**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs

2. **查看最新日志**
   - 应该看到 "booted" 消息
   - 如果有错误，会显示详细错误信息

### 步骤 7: 重新测试

1. **清除浏览器缓存**
   - 清除 cookies 和缓存
   - 或使用无痕模式

2. **重新登录**
   - 确保有有效的 session

3. **尝试订阅**
   - 访问 `/subscribe` 页面
   - 点击 "Subscribe Now"
   - 应该能正常创建 checkout session

## 🚨 常见问题

### 问题 1: 函数名称不匹配

**症状：** 404 错误持续出现

**解决：**
- 检查 Dashboard 中的实际函数名称
- 确保与代码中调用的名称完全一致
- 函数名称区分大小写

### 问题 2: 函数已部署但仍有 404

**可能原因：**
- 缓存问题
- 区域不同步
- 权限问题

**解决：**
1. 等待几分钟让部署生效
2. 清除浏览器缓存
3. 检查函数是否在正确的区域（region）

### 问题 3: CLI 部署失败

**错误信息：** `Function not found` 或认证错误

**解决：**
```bash
# 重新登录
supabase login

# 检查项目链接
supabase projects list

# 重新链接项目
supabase link --project-ref wqinxqlsmoroqgqpdjfk

# 再次部署
supabase functions deploy stripe-checkout
```

## 📋 快速检查清单

完成以下检查：

- [ ] 函数 `stripe-checkout` 在 Dashboard 中显示为 "Active"
- [ ] 函数名称完全匹配（`stripe-checkout`）
- [ ] 所有必需的 secrets 已配置
- [ ] 函数日志显示 "booted" 消息
- [ ] 浏览器缓存已清除
- [ ] 用户已登录（有有效的 session）

## 🔍 调试技巧

### 查看实际部署的函数

在 Supabase Dashboard 中：
1. 访问 Functions 页面
2. 查看所有已部署的函数列表
3. 确认 `stripe-checkout` 在列表中

### 测试函数端点

使用 curl 或 Postman 测试：

```bash
curl -X POST \
  https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-checkout \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"priceId": "your_price_id"}'
```

**预期响应：**
- ✅ 200 OK + checkout session URL（如果认证成功）
- ✅ 401 Unauthorized（如果未认证，但函数存在）
- ❌ 404 Not Found（函数不存在）

---

**完成以上步骤后，404 错误应该会消失，订阅功能可以正常工作！** 🎉

