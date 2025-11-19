# 🚀 快速修复：邮箱验证链接指向 Localhost

## 问题
在 https://pawstories.vercel.app/ 注册后，邮箱验证链接指向 `localhost`，用户无法验证。

## ⚡ 立即修复（2步）

### 步骤 1: 配置 Supabase Site URL（最重要！）

1. **打开 Supabase Dashboard**
   - 访问: https://supabase.com/dashboard/project/mqfxxnjudwtqgvxtzbso/auth/url-configuration

2. **设置 Site URL**
   ```
   Site URL: https://pawstories.vercel.app
   ```

3. **添加 Redirect URLs**（每行一个）:
   ```
   https://pawstories.vercel.app/auth/confirm
   https://pawstories.vercel.app/auth/callback
   https://pawstories.vercel.app/protected
   https://pawstories.vercel.app/dashboard
   https://pawstories.vercel.app/auth/update-password
   ```

4. **保存** - 配置会在几分钟内生效

### 步骤 2: 添加 Vercel 环境变量（可选但推荐）

1. **打开 Vercel Dashboard**
   - 访问: https://vercel.com/dashboard
   - 选择 `pawstories` 项目
   - Settings → Environment Variables

2. **添加环境变量**
   - Key: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://pawstories.vercel.app`
   - 选择环境: **Production** 和 **Preview**

3. **重新部署** - 让环境变量生效

## ✅ 验证

1. 等待 2-3 分钟让 Supabase 配置生效
2. 访问 https://pawstories.vercel.app/auth/sign-up
3. 注册一个新账户
4. 检查邮箱 - 验证链接应该指向 `https://pawstories.vercel.app/auth/confirm?...`
5. 点击链接应该能成功验证

## 📝 代码已更新

我已经更新了代码：
- ✅ `components/sign-up-form.tsx` - 使用环境变量
- ✅ `components/forgot-password-form.tsx` - 使用环境变量

代码现在会优先使用 `NEXT_PUBLIC_SITE_URL`，如果没有则回退到 `window.location.origin`。

## 🔍 如果还是不行

1. **检查 Supabase 项目是否正确**
   - Production 应该使用: `mqfxxnjudwtqgvxtzbso` (pro项目)
   - 检查环境变量 `NEXT_PUBLIC_SUPABASE_URL` 是否为: `https://mqfxxnjudwtqgvxtzbso.supabase.co`

2. **清除缓存**
   - 使用无痕模式测试
   - 或等待更长时间（最多10分钟）

3. **检查 Supabase 邮件模板**
   - Dashboard → Authentication → Email Templates
   - 确认模板中的链接格式

## 📚 详细说明

完整文档请查看: `FIX_EMAIL_VERIFICATION.md`

