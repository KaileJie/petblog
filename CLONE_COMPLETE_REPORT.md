# ✅ Dev到Pro克隆完成报告

## 🎉 已完成的工作

### ✅ 1. 项目链接
- Pro项目 (`mqfxxnjudwtqgvxtzbso`) 已成功链接

### ✅ 2. 数据库迁移
所有5个迁移已成功应用到pro项目：

| 迁移文件 | 状态 | 说明 |
|---------|------|------|
| `20250108000000_create_blogs_table.sql` | ✅ 已应用 | 创建blogs表 |
| `20251107141118_create_profiles_table.sql` | ✅ 已应用 | 创建profiles表 |
| `20251111152509_create_blog_images_bucket.sql` | ✅ 已应用 | 创建存储bucket |
| `20251112060341_create_subscriptions_table.sql` | ✅ 已应用 | 创建subscriptions表 |
| `20251114000000_fix_subscriptions_schema.sql` | ✅ 已应用 | 修复subscriptions schema |

**验证命令**:
```bash
cd petblog
supabase migration list
```

### ✅ 3. Edge Functions部署
所有5个Edge Functions已成功部署到pro项目：

- ✅ `stripe-checkout` - 创建Stripe结账会话
- ✅ `stripe-portal` - Stripe客户门户
- ✅ `stripe-webhook` - Stripe webhook处理器
- ✅ `validate-stripe-session` - 验证Stripe会话
- ✅ `test-secret` - 测试secrets配置

**Dashboard链接**: https://supabase.com/dashboard/project/mqfxxnjudwtqgvxtzbso/functions

### ✅ 4. Storage Buckets
`blog-images` bucket已通过迁移自动创建，包含所有必要的策略。

## ⚠️ 需要手动完成的步骤

### 🔐 1. 配置Secrets（重要！）

Edge Functions需要以下环境变量才能正常工作：

#### 方法1: 使用Supabase Dashboard（推荐）

1. 访问: https://supabase.com/dashboard/project/mqfxxnjudwtqgvxtzbso/settings/functions
2. 在"Secrets"部分添加：

**必需Secrets**:
- `STRIPE_SECRET_KEY` - Stripe生产密钥 (`sk_live_...`)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook签名密钥 (`whsec_...`)

**自动配置** (通常已存在):
- `SUPABASE_URL` - 自动设置
- `SUPABASE_SERVICE_ROLE_KEY` - 自动设置
- `SUPABASE_ANON_KEY` - 自动设置

#### 方法2: 使用CLI

```bash
cd petblog
supabase secrets set STRIPE_SECRET_KEY=sk_live_你的密钥
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_你的密钥
```

⚠️ **重要**: Pro项目必须使用**生产环境**的Stripe密钥 (`sk_live_...`)，不是测试密钥！

### 🔓 2. 配置Edge Function权限

某些函数需要公开访问（禁用JWT验证）：

#### stripe-webhook函数
1. 访问: https://supabase.com/dashboard/project/mqfxxnjudwtqgvxtzbso/functions/stripe-webhook
2. 点击"Settings"
3. 禁用"Verify JWT"选项
4. 保存

**原因**: Stripe无法提供Supabase JWT token，所以webhook必须是公开的。

### 🔗 3. 更新Stripe Webhook端点

在Stripe Dashboard中更新webhook端点URL：

**新的Webhook URL**:
```
https://mqfxxnjudwtqgvxtzbso.supabase.co/functions/v1/stripe-webhook
```

**步骤**:
1. 登录Stripe Dashboard
2. 进入 Developers → Webhooks
3. 找到现有的webhook端点
4. 更新URL为上面的pro项目URL
5. 确保使用pro项目的`STRIPE_WEBHOOK_SECRET`

### 📝 4. 更新应用环境变量

更新您的应用代码中的环境变量，指向pro项目：

**Pro项目信息**:
- Project ID: `mqfxxnjudwtqgvxtzbso`
- URL: `https://mqfxxnjudwtqgvxtzbso.supabase.co`
- Anon Key: 从Dashboard获取
- Service Role Key: 从Dashboard获取

**环境变量示例** (`.env.production`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://mqfxxnjudwtqgvxtzbso.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon_key
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
```

## ✅ 验证清单

完成上述步骤后，请验证：

- [ ] Secrets已配置（STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET）
- [ ] stripe-webhook函数已禁用JWT验证
- [ ] Stripe webhook端点已更新为pro项目URL
- [ ] 应用环境变量已更新为pro项目
- [ ] Storage bucket可以上传文件
- [ ] Edge Functions可以正常调用
- [ ] 数据库表结构正确

## 🧪 测试建议

1. **测试Edge Functions**:
   ```bash
   # 测试stripe-checkout
   curl -X POST https://mqfxxnjudwtqgvxtzbso.supabase.co/functions/v1/stripe-checkout \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json"
   ```

2. **测试Storage**:
   - 尝试上传一张图片到blog-images bucket
   - 验证权限是否正确

3. **测试数据库**:
   - 创建测试用户
   - 创建测试博客
   - 验证RLS策略是否正常工作

## 📊 项目对比

| 项目 | Project ID | 状态 |
|------|-----------|------|
| Dev | `wqinxqlsmoroqgqpdjfk` | ✅ 原始项目 |
| Pro | `mqfxxnjudwtqgvxtzbso` | ✅ 已克隆 |

## 🆘 故障排除

如果遇到问题：

1. **检查迁移状态**:
   ```bash
   supabase migration list
   ```

2. **查看Edge Function日志**:
   - Dashboard → Functions → 选择函数 → Logs

3. **验证Secrets**:
   ```bash
   supabase secrets list
   ```

4. **重新部署函数** (如果需要):
   ```bash
   supabase functions deploy <function-name>
   ```

## 📚 相关文档

- [Supabase Dashboard](https://supabase.com/dashboard/project/mqfxxnjudwtqgvxtzbso)
- [Edge Functions文档](https://supabase.com/docs/guides/functions)
- [迁移文档](https://supabase.com/docs/guides/cli/local-development#database-migrations)

---

**完成时间**: $(date)
**状态**: ✅ 迁移和部署完成，等待Secrets配置

