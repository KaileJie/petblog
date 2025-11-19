# ⚡ 快速测试清单

## 🚀 开始测试前

### ✅ 步骤 1: 应用数据库迁移
```bash
cd petblog
supabase db push
```
**状态：** ⏳ 正在应用...

### ✅ 步骤 2: 确认 Secrets 配置
访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

确认：
- [ ] `STRIPE_SECRET_KEY` 已设置
- [ ] `STRIPE_WEBHOOK_SECRET` 已设置（与 Stripe Dashboard 一致）
- [ ] `STRIPE_PRICE_ID` 已设置
- [ ] `SITE_URL` 已设置（或使用默认值）

### ✅ 步骤 3: 启动开发服务器
```bash
pnpm dev
```

---

## 🧪 核心测试流程

### 测试 A: 完整订阅流程（最重要）

1. **访问订阅页面**
   - 打开：`http://localhost:3000/subscribe`
   - 确保已登录

2. **点击 "Subscribe Now"**
   - ✅ 应该重定向到 Stripe Checkout

3. **完成支付**
   - 使用测试卡：`4242 4242 4242 4242`
   - 任意未来日期、CVC、邮编

4. **验证重定向**
   - ✅ URL 应该是：`/dashboard?session_id=cs_test_...`
   - ✅ 看到 "Verifying your subscription..."
   - ✅ 然后看到 "Welcome to PetBlog Premium!"
   - ✅ 最后显示 dashboard（**无重定向循环**）

5. **检查数据库**
   - Supabase Dashboard → Table Editor → `subscriptions`
   - ✅ 新记录已创建
   - ✅ `status` 是 `trialing` 或 `active`

**✅ 成功标准：** 无重定向循环，订阅成功创建

---

### 测试 B: 已订阅用户访问订阅页面

1. **使用已有订阅的用户登录**
2. **访问** `http://localhost:3000/subscribe`
3. **验证**
   - ✅ 立即重定向到 `/dashboard`
   - ✅ 不显示订阅表单

**✅ 成功标准：** 正确重定向，无循环

---

### 测试 C: 未订阅用户访问 Dashboard

1. **使用没有订阅的用户登录**
2. **访问** `http://localhost:3000/dashboard`
3. **验证**
   - ✅ 重定向到 `/subscribe`
   - ✅ 无错误

**✅ 成功标准：** 正确重定向，无错误

---

## 🔍 调试工具

### 查看 Edge Function 日志
1. Supabase Dashboard → Edge Functions
2. 选择函数（`stripe-webhook` 或 `validate-stripe-session`）
3. 点击 "Logs" 标签
4. 查找：
   - ✅ `🔐 Secret source: Dashboard`
   - ✅ `✅ Signature verified successfully`
   - ✅ `✅ Subscription created/updated`

### 查看浏览器控制台
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签
3. 查找：
   - ✅ `🔍 DashboardContent rendered`
   - ✅ `📊 Subscription check result`
   - ❌ 任何错误消息

### 检查数据库
```sql
-- 在 Supabase SQL Editor 中运行
SELECT 
  id,
  user_id,
  stripe_subscription_id,
  status,
  current_period_start,
  current_period_end,
  created_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🚨 如果出现问题

### 问题：重定向循环
**检查：**
1. 浏览器控制台错误
2. Middleware 日志
3. Dashboard page 组件逻辑

**解决：** 确认已应用所有代码修复

### 问题：订阅未创建
**检查：**
1. Edge Function 日志（`validate-stripe-session`）
2. Webhook 日志（`stripe-webhook`）
3. 数据库 RLS 策略

**解决：** 确认 secrets 配置正确，RLS 策略允许插入

### 问题：Webhook 签名验证失败
**检查：**
1. `STRIPE_WEBHOOK_SECRET` 是否与 Stripe Dashboard 一致
2. Webhook endpoint URL 是否正确

**解决：** 重新复制 signing secret 并更新

---

## ✅ 测试完成检查

完成所有测试后，确认：

- [ ] ✅ 新用户订阅流程完整无错误
- [ ] ✅ 已订阅用户正确访问 dashboard
- [ ] ✅ 未订阅用户正确重定向
- [ ] ✅ 无重定向循环
- [ ] ✅ 数据库记录完整
- [ ] ✅ 无控制台错误
- [ ] ✅ Webhook 正常工作

---

**开始测试：** 运行 `pnpm dev` 并按照上述步骤进行

