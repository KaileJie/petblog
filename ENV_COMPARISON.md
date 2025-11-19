# 环境变量配置对比分析

## 📊 代码中实际使用的环境变量

根据代码分析，项目需要以下环境变量：

### ✅ 必需的环境变量

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - 使用位置: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`
   - 用途: Supabase项目URL

2. **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`** ⚠️
   - 使用位置: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`
   - 用途: Supabase匿名密钥（用于客户端）
   - ⚠️ **注意**: 这是代码中使用的变量名

3. **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`**
   - 使用位置: 可能在前端Stripe集成中使用
   - 用途: Stripe公开密钥（用于客户端）

4. **`NEXT_PUBLIC_STRIPE_PRICE_ID`**
   - 使用位置: `app/subscribe/page.tsx` (line 103)
   - 用途: Stripe价格ID

### 🔒 服务器端环境变量（Edge Functions）

这些应该在Supabase Edge Functions的Secrets中配置，不在Vercel环境变量中：

- `STRIPE_SECRET_KEY` - Stripe密钥（服务器端）
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook签名密钥
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase服务角色密钥（自动配置）

## 🔍 Preview vs Production 对比

### Preview环境（根据图片描述）
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` ⭐ **正确**
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- ✅ `NEXT_PUBLIC_STRIPE_PRICE_ID`
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`

### Production环境（根据图片描述）
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ⚠️ **错误！应该是 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`**
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- ✅ `NEXT_PUBLIC_STRIPE_PRICE_ID`
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`

## ⚠️ 发现的问题

### 🚨 严重问题：环境变量名称不一致

**问题**: Production环境使用了 `NEXT_PUBLIC_SUPABASE_ANON_KEY`，但代码中使用的是 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

**影响**: 
- Production环境将无法连接到Supabase
- 所有Supabase操作都会失败
- 认证、数据库查询、存储等功能都会中断

**解决方案**:
1. 在Production环境中添加 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
2. 值应该与 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 相同（都是Supabase的anon key）
3. 可以选择删除 `NEXT_PUBLIC_SUPABASE_ANON_KEY`（如果不再使用）

## ✅ 建议的修复步骤

### 步骤1: 修复Production环境变量

在Vercel Dashboard中：

1. 进入项目设置 → Environment Variables
2. 选择 **Production** 环境
3. 添加新变量：
   - Key: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
   - Value: 复制 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 的值
4. 保存
5. 重新部署Production环境

### 步骤2: 验证配置

确保两个环境都有相同的变量：

| 变量名 | Preview | Production |
|--------|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | ✅ | ❌ → ✅ (需要添加) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | ✅ |
| `NEXT_PUBLIC_STRIPE_PRICE_ID` | ✅ | ✅ |
| `STRIPE_SECRET_KEY` | ✅ | ✅ |
| `STRIPE_WEBHOOK_SECRET` | ✅ | ✅ |

### 步骤3: 检查Supabase项目配置

确保Production环境使用正确的Supabase项目：

- **Preview**: 应该使用 `wqinxqlsmoroqgqpdjfk` (dev项目)
- **Production**: 应该使用 `mqfxxnjudwtqgvxtzbso` (pro项目)

检查 `NEXT_PUBLIC_SUPABASE_URL` 的值：
- Preview: `https://wqinxqlsmoroqgqpdjfk.supabase.co`
- Production: `https://mqfxxnjudwtqgvxtzbso.supabase.co`

## 📝 完整的环境变量清单

### Preview环境应该有的变量：

```env
NEXT_PUBLIC_SUPABASE_URL=https://wqinxqlsmoroqgqpdjfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=<dev项目的anon_key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (测试密钥)
NEXT_PUBLIC_STRIPE_PRICE_ID=price_... (测试价格ID)
STRIPE_SECRET_KEY=sk_test_... (测试密钥)
STRIPE_WEBHOOK_SECRET=whsec_... (测试webhook密钥)
```

### Production环境应该有的变量：

```env
NEXT_PUBLIC_SUPABASE_URL=https://mqfxxnjudwtqgvxtzbso.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=<pro项目的anon_key> ⚠️ 需要添加
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (生产密钥)
NEXT_PUBLIC_STRIPE_PRICE_ID=price_... (生产价格ID)
STRIPE_SECRET_KEY=sk_live_... (生产密钥)
STRIPE_WEBHOOK_SECRET=whsec_... (生产webhook密钥)
```

## 🔍 验证方法

部署后，检查浏览器控制台是否有错误：
- 如果看到 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY is not defined`，说明环境变量未正确设置
- 如果看到Supabase连接错误，检查URL和密钥是否正确

## 📚 相关文件

- `lib/supabase/client.ts` - 客户端Supabase配置
- `lib/supabase/server.ts` - 服务器端Supabase配置
- `lib/supabase/middleware.ts` - 中间件Supabase配置
- `app/subscribe/page.tsx` - Stripe集成

