# 🧪 测试订阅流程 - 重要

## ⚠️ 关于 Deno.core.runMicrotasks() 错误

这个错误是 Supabase Edge Runtime 的已知问题，**但可能不会阻止功能正常工作**。

## 📋 请测试以下流程

### 测试 1: 创建 Checkout Session

1. **访问** `/subscribe` 页面
2. **点击** "Subscribe Now"
3. **预期结果**：
   - ✅ 成功重定向到 Stripe Checkout 页面
   - ✅ 可以看到 Stripe 的支付表单
   - ❌ 如果失败，会显示错误信息

**如果这一步成功**，说明 `stripe-checkout` 函数工作正常（尽管有错误日志）。

### 测试 2: 完成支付

1. **在 Stripe Checkout 页面**：
   - 使用测试卡：`4242 4242 4242 4242`
   - 过期日期：`12/34`
   - CVC：`123`
   - 点击 "Subscribe"

2. **预期结果**：
   - ✅ 成功完成支付
   - ✅ 重定向到 `/dashboard?session_id=xxx`
   - ❌ 如果失败，会停留在 Stripe 页面或显示错误

### 测试 3: 验证 Session

1. **在 Dashboard 页面**（带 session_id）：
   - 应该看到 "Verifying your subscription..."
   - 然后看到 "Welcome to PetBlog Premium!"
   - 最后加载 dashboard

2. **预期结果**：
   - ✅ 成功验证并更新订阅
   - ✅ URL 变为 `/dashboard`（session_id 被移除）
   - ❌ 如果失败，会显示错误信息

### 测试 4: 防止循环

1. **再次访问** `/subscribe` 页面
2. **预期结果**：
   - ✅ 立即重定向到 `/dashboard`
   - ❌ 如果失败，会显示 "Subscribe Now" 按钮（循环）

## 🔍 检查函数日志

查看函数日志，查找：

### stripe-checkout 函数日志
- https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs
- 查找 "Stripe key check" 输出
- 查找 checkout session 创建成功的日志

### validate-stripe-session 函数日志
- https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/validate-stripe-session/logs
- 查找 session 验证成功的日志
- 查找数据库更新成功的日志

## ✅ 如果功能正常工作

如果所有测试步骤都成功：
- ✅ 可以创建 checkout session
- ✅ 可以完成支付
- ✅ 可以验证 session
- ✅ 可以更新数据库
- ✅ 可以防止循环

**那么这个 Deno.core.runMicrotasks() 错误可以暂时忽略**。这是 Supabase Edge Runtime 的已知问题，不影响功能。

## ❌ 如果功能不工作

如果任何步骤失败，请告诉我：
1. **哪一步失败？**
2. **浏览器控制台有什么错误？**
3. **函数日志中有什么错误？**（除了 Deno.core.runMicrotasks()）

然后我会帮你实现替代方案。

---

**请现在测试订阅流程，告诉我每一步的结果！**

