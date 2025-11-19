# 完整修复指南：STRIPE_SECRET_KEY 无法访问

## 🔍 问题诊断

日志显示：
- ✅ `SUPABASE_URL` - 可以访问
- ✅ `SUPABASE_ANON_KEY` - 可以访问
- ❌ `STRIPE_SECRET_KEY` - 无法访问

这说明环境变量系统正常工作，但 `STRIPE_SECRET_KEY` 在 Dashboard 中可能：
1. 没有设置
2. 名称不匹配
3. 设置了但需要重新部署函数

## 🚀 完整解决方案

### 方法 1: 通过 Dashboard 设置（推荐）

#### 步骤 1: 访问 Secrets 页面
https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

#### 步骤 2: 删除旧的 STRIPE_SECRET_KEY（如果存在）
1. 找到 `STRIPE_SECRET_KEY`
2. 点击删除
3. 确认删除

#### 步骤 3: 添加新的 STRIPE_SECRET_KEY
1. 点击 "Add new secret"
2. **名称**: `STRIPE_SECRET_KEY`（完全匹配，全大写）
3. **值**: 
   - 访问：https://dashboard.stripe.com/test/apikeys
   - 点击 "Reveal test key"
   - 复制完整值（以 `sk_test_` 开头）
   - 粘贴到值字段
4. 保存

#### 步骤 4: 重新部署函数
```bash
supabase functions deploy stripe-checkout
```

#### 步骤 5: 等待并测试
1. 等待 10-30 秒让部署生效
2. 刷新浏览器页面
3. 再次测试订阅功能

### 方法 2: 通过 CLI 重新设置

如果 Dashboard 设置不生效，尝试通过 CLI：

```bash
# 删除旧的
supabase secrets unset STRIPE_SECRET_KEY

# 重新设置（确保值完整）
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_COMPLETE_KEY_HERE

# 重新部署
supabase functions deploy stripe-checkout
```

### 方法 3: 验证 Dashboard 中的设置

1. **访问 Secrets 页面**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

2. **检查每个 Secret**
   - 双击每个 secret 查看名称和值
   - 确认 `STRIPE_SECRET_KEY` 存在
   - 确认名称是 `STRIPE_SECRET_KEY`（没有空格、没有特殊字符）

3. **如果名称或值有问题**
   - 删除旧的 secret
   - 重新添加，确保名称和值都正确

## 🔍 验证步骤

### 1. 检查 Dashboard 中的 Secrets
- 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets
- 确认 `STRIPE_SECRET_KEY` 在列表中
- 确认名称完全匹配

### 2. 重新部署函数
```bash
supabase functions deploy stripe-checkout
```

### 3. 查看函数日志
- 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs
- 查找最新的日志
- 应该看到：`STRIPE_SECRET_KEY: ✅ Set`

### 4. 测试订阅功能
- 刷新浏览器
- 点击 "Subscribe Now"
- 应该重定向到 Stripe Checkout

## ⚠️ 常见错误

### 错误 1: 名称有空格
- ❌ `STRIPE_SECRET_KEY `（尾部有空格）
- ❌ ` STRIPE_SECRET_KEY`（前面有空格）
- ✅ `STRIPE_SECRET_KEY`（没有空格）

### 错误 2: 使用了错误的 Key
- ❌ `pk_test_...`（Publishable Key）
- ✅ `sk_test_...`（Secret Key）

### 错误 3: 值不完整
- ❌ 值被截断
- ✅ 完整的 Secret Key（100+ 字符）

## 📝 检查清单

在 Dashboard 中确认：
- [ ] `STRIPE_SECRET_KEY` 存在
- [ ] 名称是 `STRIPE_SECRET_KEY`（完全匹配）
- [ ] 值以 `sk_test_` 或 `sk_live_` 开头
- [ ] 值长度约 100+ 字符
- [ ] 值前后没有空格
- [ ] 已重新部署函数
- [ ] 等待了足够的时间让部署生效

---

**请按照方法 1 的步骤操作，特别是删除旧的 secret 后重新添加，然后重新部署函数！**

