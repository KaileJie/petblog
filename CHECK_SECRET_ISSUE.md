# 🔍 STRIPE_SECRET_KEY 无法读取问题诊断

## 当前状态

✅ **Secret 存在于列表中**: `STRIPE_SECRET_KEY` 在 secrets 列表中  
❌ **函数无法读取**: 运行时 `Deno.env.get('STRIPE_SECRET_KEY')` 返回 `undefined`

## 可能的原因

### 1. Secret 值可能为空
- Secret 存在但值为空字符串
- 需要在 Dashboard 中检查 secret 的实际值

### 2. 需要通过 Dashboard 设置
- 某些情况下，通过 CLI 设置的 secrets 可能不会正确传递到 Edge Functions
- 建议通过 Dashboard 重新设置

### 3. Secret 名称可能有隐藏字符
- 名称可能有前后空格或特殊字符

## 🚀 解决方案

### 方法 1: 通过 Dashboard 重新设置（推荐）

1. **访问 Secrets 页面**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

2. **删除旧的 STRIPE_SECRET_KEY**
   - 找到 `STRIPE_SECRET_KEY`
   - 点击删除
   - 确认删除

3. **添加新的 STRIPE_SECRET_KEY**
   - 点击 "Add new secret"
   - **名称**: `STRIPE_SECRET_KEY`（完全匹配，全大写，没有空格）
   - **值**: 
     - 访问：https://dashboard.stripe.com/test/apikeys
     - 找到 "Secret key"
     - 点击 "Reveal test key"
     - 复制完整值（以 `sk_test_` 开头，100+ 字符）
     - 粘贴到值字段
   - **确保值前后没有空格**
   - 保存

4. **重新部署函数**
   ```bash
   cd /Users/dallylovely/Desktop/Jie/AI/PetBlog/petblog
   supabase functions deploy stripe-checkout
   ```

### 方法 2: 通过 CLI 重新设置

```bash
cd /Users/dallylovely/Desktop/Jie/AI/PetBlog/petblog

# 1. 删除旧的
supabase secrets unset STRIPE_SECRET_KEY

# 2. 重新设置（确保值完整，没有空格）
# 替换 YOUR_STRIPE_SECRET_KEY 为你的完整 Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_COMPLETE_KEY_HERE

# 3. 验证
supabase secrets list | grep STRIPE_SECRET_KEY

# 4. 重新部署
supabase functions deploy stripe-checkout
```

## 🔍 查看函数日志

查看函数日志以获取更多调试信息：
- https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs

查找日志中的：
- `Stripe key check:` - 显示 key 是否存在
- `Available STRIPE env vars:` - 显示所有可用的 STRIPE 相关环境变量

如果看到 `Available STRIPE env vars: []`，说明函数运行时完全看不到任何 STRIPE 相关的环境变量。

## ⚠️ 重要提示

1. **确保使用正确的 Key**
   - ✅ Secret Key: `sk_test_...`（用于服务器端）
   - ❌ Publishable Key: `pk_test_...`（不能用于服务器端）

2. **确保 Key 完整**
   - 从 Stripe Dashboard 复制完整的 key
   - 通常 100+ 字符
   - 不要有前后空格

3. **重新部署函数**
   - 修改 secret 后必须重新部署函数才能生效

## 📋 验证步骤

1. **在 Dashboard 中设置 secret**
2. **重新部署函数**
3. **等待 10-30 秒**
4. **触发一次订阅请求**
5. **查看函数日志**
   - 应该看到：`hasSTRIPE_SECRET_KEY: true`
   - 应该看到：`keyLength: 100+`
   - 应该看到：`keyPrefix: "sk_test_..."`

---

**建议先尝试方法 1（通过 Dashboard 设置），这通常是最可靠的方法！**

