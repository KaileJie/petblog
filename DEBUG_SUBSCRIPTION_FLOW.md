# 🔍 调试订阅流程

## 问题

用户付完款后，返回到 Subscribe Now 页面，一直在循环。

## 已修复的问题

1. ✅ **Dashboard Layout** - 移除了立即重定向，允许 session_id 验证流程
2. ✅ **Dashboard Page** - 添加了订阅状态检查和重定向逻辑
3. ✅ **Subscribe Page** - 改进了订阅检查逻辑
4. ✅ **验证函数** - 已创建并部署 validate-stripe-session

## 调试步骤

### 1. 检查浏览器控制台

打开浏览器开发者工具（F12），查看 Console 标签：

应该看到：
- `Calling validate-stripe-session with session_id: cs_...`
- `Validation response: { data: {...}, error: ... }`
- `Subscription verified successfully, updating database...`
- `Reloading dashboard...`

### 2. 检查函数日志

#### validate-stripe-session 函数日志
- https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/validate-stripe-session/logs

查找：
- Session 验证成功的日志
- 数据库更新成功的日志
- 任何错误信息

#### stripe-checkout 函数日志
- https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs

查找：
- Checkout session 创建成功的日志

### 3. 检查数据库

在 Supabase Dashboard 中检查 `subscriptions` 表：
- https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/editor

查看：
- 是否有用户的订阅记录？
- 订阅状态是什么？（应该是 `active` 或 `trialing`）
- `user_id` 是否正确？

### 4. 测试流程

1. **清除测试数据**（如果需要）：
   ```sql
   DELETE FROM subscriptions WHERE user_id = 'YOUR_USER_ID';
   ```

2. **访问 `/subscribe`**
   - 应该显示订阅页面（不是立即重定向）

3. **点击 "Subscribe Now"**
   - 应该重定向到 Stripe Checkout

4. **完成支付**
   - 使用测试卡：4242 4242 4242 4242
   - 应该重定向到 `/dashboard?session_id=xxx`

5. **查看验证流程**
   - 应该看到 "Verifying your subscription..."
   - 然后看到 "Welcome to PawStories Premium!"
   - 最后重定向到 dashboard

6. **检查数据库**
   - 应该看到订阅记录已创建/更新

7. **再次访问 `/subscribe`**
   - 应该立即重定向到 dashboard

## 常见问题

### 问题 1: validate-stripe-session 函数没有被调用

**检查**：
- 浏览器控制台是否有错误？
- 函数日志中是否有请求记录？

**解决**：
- 检查函数是否正确部署
- 检查函数 URL 是否正确

### 问题 2: 验证成功但数据库没有更新

**检查**：
- validate-stripe-session 函数日志
- 数据库权限设置

**解决**：
- 确保使用 service_role_key 更新数据库
- 检查 RLS 策略

### 问题 3: 数据库已更新但仍重定向到 subscribe

**检查**：
- Subscribe 页面的订阅检查逻辑
- 浏览器控制台的日志

**解决**：
- 清除浏览器缓存
- 检查查询条件是否正确

---

**请按照这些步骤调试，并告诉我每一步的结果！**

