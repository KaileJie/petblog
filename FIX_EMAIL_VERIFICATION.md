# 修复邮箱验证链接指向 Localhost 的问题

## 🔍 问题描述

在 Vercel 部署的网站上注册后，收到的邮箱验证链接指向 `localhost`，导致用户无法验证邮箱。

**网站地址**: https://pawstories.vercel.app/

## 🎯 解决方案

需要在 Supabase Dashboard 中配置正确的 Site URL 和 Redirect URLs。

### 步骤 1: 配置 Supabase Site URL

1. **访问 Supabase Dashboard**
   - 登录: https://supabase.com/dashboard
   - 选择 **Pro项目** (`mqfxxnjudwtqgvxtzbso`)

2. **进入认证设置**
   - 导航到: **Authentication** → **URL Configuration**
   - 或直接访问: https://supabase.com/dashboard/project/mqfxxnjudwtqgvxtzbso/auth/url-configuration

3. **设置 Site URL**
   - **Site URL**: `https://pawstories.vercel.app`
   - 这是 Supabase 生成验证链接时使用的基础 URL

### 步骤 2: 配置 Redirect URLs

在同一个页面，添加以下 **Redirect URLs**（每行一个）：

```
https://pawstories.vercel.app/auth/confirm
https://pawstories.vercel.app/auth/callback
https://pawstories.vercel.app/protected
https://pawstories.vercel.app/dashboard
https://pawstories.vercel.app/auth/update-password
```

**重要**: 
- 确保包含 `/auth/confirm` - 这是邮箱验证的重定向地址
- 不要包含尾部斜杠（除非代码中使用了）

### 步骤 3: 检查代码中的重定向配置

检查 `components/sign-up-form.tsx` 中的 `emailRedirectTo`：

```typescript
emailRedirectTo: `${window.location.origin}/auth/confirm`
```

这应该会自动使用当前域名，但为了确保，可以硬编码生产环境：

```typescript
emailRedirectTo: process.env.NODE_ENV === 'production' 
  ? 'https://pawstories.vercel.app/auth/confirm'
  : `${window.location.origin}/auth/confirm`
```

### 步骤 4: 配置环境变量（可选但推荐）

如果需要在不同环境使用不同的重定向 URL，可以添加环境变量：

**在 Vercel Dashboard 中**:
- 项目 → Settings → Environment Variables
- 添加: `NEXT_PUBLIC_SITE_URL` = `https://pawstories.vercel.app`

然后在代码中使用：
```typescript
emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/confirm`
```

## 📋 完整配置清单

### Supabase Dashboard 配置

**Pro项目** (`mqfxxnjudwtqgvxtzbso`):

| 设置项 | 值 |
|--------|-----|
| **Site URL** | `https://pawstories.vercel.app` |
| **Redirect URLs** | `https://pawstories.vercel.app/auth/confirm`<br>`https://pawstories.vercel.app/auth/callback`<br>`https://pawstories.vercel.app/protected`<br>`https://pawstories.vercel.app/dashboard`<br>`https://pawstories.vercel.app/auth/update-password` |

### Dev项目配置（如果需要）

**Dev项目** (`wqinxqlsmoroqgqpdjfk`):

| 设置项 | 值 |
|--------|-----|
| **Site URL** | `http://localhost:3000` |
| **Redirect URLs** | `http://localhost:3000/auth/confirm`<br>`http://localhost:3000/auth/callback`<br>`http://localhost:3000/protected`<br>`http://localhost:3000/dashboard`<br>`http://localhost:3000/auth/update-password` |

## 🔧 代码修改（可选）

如果需要更明确的重定向配置，可以修改 `components/sign-up-form.tsx`:

```typescript
// 当前代码（第44行）
emailRedirectTo: `${window.location.origin}/auth/confirm`,

// 建议改为
emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/confirm`,
```

然后在 Vercel 环境变量中添加：
- `NEXT_PUBLIC_SITE_URL` = `https://pawstories.vercel.app`

## ✅ 验证步骤

1. **保存 Supabase 配置后**，等待几分钟让配置生效

2. **测试注册流程**:
   - 访问: https://pawstories.vercel.app/auth/sign-up
   - 注册一个新账户
   - 检查收到的验证邮件
   - 验证链接应该指向: `https://pawstories.vercel.app/auth/confirm?token_hash=...`

3. **点击验证链接**:
   - 应该成功验证并重定向到 `/protected` 或 `/dashboard`
   - 不应该出现 localhost 链接

## 🐛 故障排除

### 如果验证链接仍然是 localhost:

1. **检查 Supabase 项目是否正确**:
   - 确保 Production 环境使用的是 Pro项目 (`mqfxxnjudwtqgvxtzbso`)
   - 检查环境变量 `NEXT_PUBLIC_SUPABASE_URL` 是否正确

2. **清除浏览器缓存**:
   - 验证链接可能被缓存
   - 尝试使用无痕模式或不同浏览器

3. **检查 Supabase 邮件模板**:
   - 进入: Authentication → Email Templates
   - 确认邮件模板中的链接格式正确

4. **查看 Supabase 日志**:
   - Dashboard → Logs → Auth Logs
   - 检查是否有错误信息

## 📚 相关文档

- [Supabase Auth URL Configuration](https://supabase.com/docs/guides/auth/auth-deep-dive/auth-deep-dive-jwts#redirect-urls-and-wildcards)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

## ⚠️ 重要提示

- **Site URL** 必须与您的实际域名完全匹配（包括 `https://`）
- **Redirect URLs** 必须包含所有可能的重定向路径
- 配置更改可能需要几分钟才能生效
- 确保 Production 和 Preview 环境使用不同的 Supabase 项目（如果需要）

