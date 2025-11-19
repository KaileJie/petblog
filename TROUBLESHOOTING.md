# Edge Function 500 错误排查指南

## 当前状态

根据 `supabase secrets list` 的输出，所有必需的环境变量都已设置：
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `STRIPE_PRICE_ID`
- ✅ `SITE_URL`

## 排查步骤

### 1. 查看函数日志

在 Supabase Dashboard 中查看详细的错误日志：

1. 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions
2. 点击 `stripe-checkout` 函数
3. 查看 **Logs** 标签页
4. 查找最新的错误日志

### 2. 检查环境变量值

虽然环境变量已设置，但请确认值是否正确：

```bash
# 检查 Stripe Secret Key 格式
# 应该以 sk_test_ 或 sk_live_ 开头

# 检查 Price ID 格式
# 应该以 price_ 开头

# 检查 SITE_URL
# 应该是一个有效的 URL
```

### 3. 常见问题

#### 问题 1: Stripe Secret Key 格式错误
- **症状**: 500 错误，日志显示 Stripe API 错误
- **解决**: 确认 `STRIPE_SECRET_KEY` 以 `sk_test_` 或 `sk_live_` 开头

#### 问题 2: Price ID 不存在或无效
- **症状**: 500 错误，日志显示 "No such price"
- **解决**: 在 Stripe Dashboard 中确认 Price ID 存在且正确

#### 问题 3: 用户没有 profile
- **症状**: 404 错误 "Profile not found"
- **解决**: 确保用户已创建 profile 记录

#### 问题 4: 数据库连接问题
- **症状**: 500 错误，日志显示数据库查询失败
- **解决**: 检查 Supabase 项目状态和数据库连接

### 4. 测试步骤

1. **刷新浏览器页面**
2. **打开浏览器开发者工具** (F12)
3. **查看 Console 标签页** - 查看新的错误信息
4. **查看 Network 标签页** - 点击失败的请求，查看响应详情
5. **查看 Supabase Dashboard 日志** - 获取服务器端详细错误

### 5. 临时调试

我已经在代码中添加了调试日志。在 Supabase Dashboard 的函数日志中，您应该能看到：
- 环境变量检查结果
- 每个步骤的详细错误信息

## 下一步

请执行以下操作并告诉我结果：

1. **查看 Supabase Dashboard 中的函数日志**
   - 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs
   - 复制最新的错误日志

2. **再次测试订阅流程**
   - 刷新页面
   - 点击 "Subscribe Now"
   - 查看浏览器控制台中的新错误信息

3. **检查 Stripe Dashboard**
   - 确认 Price ID `price_1SSVzWRx0nbLiT9kqqeHNMBv` 存在
   - 确认 Stripe Secret Key 是正确的测试密钥

请将错误日志发给我，我会帮您进一步诊断问题。

