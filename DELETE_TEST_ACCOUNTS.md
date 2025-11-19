# 🗑️ 删除测试账号指南

## 📋 方法一：通过 Supabase Dashboard 删除（推荐）

这是最简单的方法，会自动清理所有相关数据。

### 步骤 1: 删除 Auth 用户

1. **访问 Supabase Dashboard**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/auth/users

2. **找到要删除的测试账号**
   - 在用户列表中查找测试邮箱
   - 或者使用搜索功能

3. **删除用户**
   - 点击用户行右侧的 "..." 菜单
   - 选择 "Delete user"
   - 确认删除

**✅ 这会自动删除：**
- `auth.users` 表中的用户记录
- `profiles` 表中的用户资料（因为有 `ON DELETE CASCADE`）
- `subscriptions` 表中的订阅记录（因为有 `ON DELETE CASCADE`）

**⚠️ 注意：**
- `blogs` 表中的博客文章**不会**自动删除（因为 blogs 表通过 email 关联，没有外键约束）
- 如果需要删除博客，需要手动删除（见下方 SQL 方法）

### 步骤 2: 重新注册

删除后，你可以立即使用相同的邮箱重新注册。

---

## 📋 方法二：使用 SQL 脚本批量删除（适合批量清理）

如果你有多个测试账号需要删除，可以使用 SQL 脚本。

### 步骤 1: 访问 Supabase SQL Editor

1. **打开 SQL Editor**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/sql/new

### 步骤 2: 执行删除脚本

#### 选项 A: 删除特定邮箱的账号

```sql
-- 替换 'test@example.com' 为你要删除的邮箱
DO $$
DECLARE
  user_id_to_delete UUID;
BEGIN
  -- 查找用户 ID
  SELECT id INTO user_id_to_delete
  FROM auth.users
  WHERE email = 'test@example.com';
  
  -- 如果找到用户，删除相关博客（可选）
  IF user_id_to_delete IS NOT NULL THEN
    -- 获取用户的邮箱
    DECLARE
      user_email TEXT;
    BEGIN
      SELECT email INTO user_email FROM auth.users WHERE id = user_id_to_delete;
      
      -- 删除该用户的博客（可选，如果不需要保留博客）
      DELETE FROM public.blogs WHERE author = user_email;
      
      -- 删除用户（这会自动级联删除 profiles 和 subscriptions）
      DELETE FROM auth.users WHERE id = user_id_to_delete;
      
      RAISE NOTICE 'User % and related data deleted', user_email;
    END;
  ELSE
    RAISE NOTICE 'User not found';
  END IF;
END $$;
```

#### 选项 B: 删除所有测试账号（批量删除）

```sql
-- 删除所有包含 'test' 的邮箱账号（谨慎使用！）
DO $$
DECLARE
  user_record RECORD;
  deleted_count INTEGER := 0;
BEGIN
  FOR user_record IN 
    SELECT id, email 
    FROM auth.users 
    WHERE email LIKE '%test%' 
       OR email LIKE '%@example.com'
       OR email LIKE '%@test.com'
  LOOP
    -- 删除博客
    DELETE FROM public.blogs WHERE author = user_record.email;
    
    -- 删除用户（自动级联删除 profiles 和 subscriptions）
    DELETE FROM auth.users WHERE id = user_record.id;
    
    deleted_count := deleted_count + 1;
    RAISE NOTICE 'Deleted user: %', user_record.email;
  END LOOP;
  
  RAISE NOTICE 'Total deleted: % users', deleted_count;
END $$;
```

#### 选项 C: 只删除订阅相关的数据，保留博客

```sql
-- 删除特定用户的订阅和账号，但保留博客
DO $$
DECLARE
  user_id_to_delete UUID;
  user_email TEXT;
BEGIN
  -- 替换为要删除的邮箱
  SELECT id, email INTO user_id_to_delete, user_email
  FROM auth.users
  WHERE email = 'test@example.com';
  
  IF user_id_to_delete IS NOT NULL THEN
    -- 只删除用户（会自动删除 profiles 和 subscriptions）
    -- 博客会保留，但 author 字段会指向已删除的用户邮箱
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    RAISE NOTICE 'User % deleted (blogs preserved)', user_email;
  END IF;
END $$;
```

### 步骤 3: 验证删除

执行后，检查：

```sql
-- 检查是否还有该用户
SELECT * FROM auth.users WHERE email = 'test@example.com';

-- 检查 profiles 表
SELECT * FROM public.profiles WHERE email = 'test@example.com';

-- 检查 subscriptions 表（应该自动删除）
SELECT * FROM public.subscriptions 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'test@example.com'
);
```

---

## 📋 方法三：删除 Stripe 测试数据（可选）

如果你也想清理 Stripe 中的测试数据：

### 在 Stripe Dashboard 中删除

1. **访问 Stripe Dashboard**
   - https://dashboard.stripe.com/test/customers

2. **找到测试客户**
   - 搜索测试邮箱或客户 ID

3. **删除客户**
   - 点击客户
   - 在设置中选择 "Delete customer"
   - 这会同时删除相关的订阅和支付记录

**⚠️ 注意：**
- 删除 Stripe 客户不会影响 Supabase 数据库
- 如果数据库中的 subscription 记录引用了已删除的 Stripe 订阅，可能会导致问题
- 建议先删除 Supabase 用户，再删除 Stripe 客户

---

## 🔄 重新注册测试账号

删除完成后，你可以：

1. **使用相同的邮箱重新注册**
   - 访问注册页面
   - 使用之前删除的邮箱注册
   - 系统会创建新的用户记录

2. **完成订阅测试**
   - 按照 `TEST_WEBHOOK_FIX.md` 中的步骤测试
   - 验证 webhook 日志不再出现错误

---

## ⚠️ 注意事项

1. **数据备份**
   - 删除前确保不需要这些测试数据
   - 如果需要保留某些数据，使用选项 C（保留博客）

2. **级联删除**
   - 删除 `auth.users` 会自动删除 `profiles` 和 `subscriptions`
   - 但**不会**自动删除 `blogs`（因为 blogs 表没有外键约束）

3. **Stripe 数据**
   - Supabase 和 Stripe 的数据是独立的
   - 删除 Supabase 用户不会删除 Stripe 客户
   - 如果需要完全清理，需要分别删除

4. **生产环境**
   - ⚠️ **不要在生产环境中使用批量删除脚本**
   - 只在测试/开发环境中使用

---

## ✅ 快速删除单个测试账号（最简单）

1. 访问：https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/auth/users
2. 找到测试账号
3. 点击 "..." → "Delete user"
4. 确认删除
5. 完成！可以立即用相同邮箱重新注册

---

**删除后，你就可以用相同的邮箱重新注册并测试 webhook 修复了！** 🎉

