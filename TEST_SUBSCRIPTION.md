# 测试订阅功能

## ✅ 函数已成功部署

日志显示函数已成功启动：`booted (time: 60ms)`

## 🧪 测试步骤

### 1. 刷新浏览器页面
- 确保页面是最新版本
- 清除浏览器缓存（如果需要）

### 2. 测试订阅流程

1. **确保已登录**
   - 如果未登录，先登录账户

2. **访问订阅页面**
   - 访问：http://localhost:3000/subscribe
   - 或点击导航中的订阅链接

3. **点击 "Subscribe Now" 按钮**

4. **预期结果**
   - ✅ 成功：应该重定向到 Stripe Checkout 页面
   - ❌ 失败：会显示错误消息

### 3. 查看结果

#### 如果成功 ✅
- 会重定向到 Stripe Checkout 页面
- 可以看到订阅详情和支付表单

#### 如果失败 ❌
- 页面会显示错误消息
- 打开浏览器开发者工具（F12）查看 Console 错误
- 查看 Supabase Dashboard 中的函数日志

## 📊 查看函数日志

如果出现问题，查看详细日志：

1. **访问函数日志**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs

2. **查看最新的日志条目**
   - 查找最新的错误或成功消息
   - 查看 `Stripe key check:` 的输出
   - 查看 `Environment variables check:` 的输出

3. **成功日志应该显示**
   ```
   Stripe key check: {
     hasSTRIPE_SECRET_KEY: true,
     keyLength: 100+,
     keyPrefix: "sk_test_..."
   }
   ```

## 🔍 常见问题

### 问题 1: 仍然显示 "STRIPE_SECRET_KEY is not configured"
**解决**:
- 确认在 Dashboard 中设置了 `STRIPE_SECRET_KEY`
- 确认名称完全匹配（区分大小写）
- 重新部署函数

### 问题 2: 重定向到 Stripe 但显示错误
**解决**:
- 检查 Stripe Dashboard 中的 Price ID 是否正确
- 确认 Stripe Secret Key 是有效的测试密钥

### 问题 3: 函数超时或 500 错误
**解决**:
- 查看函数日志中的详细错误信息
- 检查所有 secrets 是否都已设置
- 确认 Supabase 和 Stripe 的连接正常

## ✅ 成功标志

如果一切正常，你应该看到：
1. ✅ 点击 "Subscribe Now" 后立即重定向
2. ✅ 进入 Stripe Checkout 页面
3. ✅ 看到订阅详情（$5.99/month，3-day trial）
4. ✅ 可以输入测试卡号进行测试

---

**请现在测试订阅功能，并告诉我结果！**

