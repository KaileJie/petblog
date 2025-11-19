# 🗑️ 手动删除 "Mac" 端点指南

## 问题说明

"Mac" 端点可能是 Stripe CLI 创建的本地监听器，可能不会出现在传统的 webhook endpoints API 中，但会在 Stripe Dashboard 的 "Event destinations" 中显示。

---

## ✅ 方法 1: 在 Stripe Dashboard 中手动删除（推荐）

### 步骤：

1. **访问 Stripe Dashboard**
   - 打开：https://dashboard.stripe.com/webhooks
   - 或：https://dashboard.stripe.com/test/webhooks

2. **找到 "Mac" 端点**
   - 在 "Event destinations" 页面
   - 找到显示为 "Mac" 的条目
   - URL 应该是：`https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook`

3. **删除端点**
   - 点击 "Mac" 端点右侧的 **三个点 (⋯)** 菜单
   - 选择 **"Delete"** 或 **"Remove"**
   - 确认删除

4. **如果删除按钮不可用**
   - 尝试点击端点进入详情页
   - 在详情页中查找删除选项
   - 或者尝试禁用端点（Disable）

---

## ✅ 方法 2: 使用 Stripe CLI 删除

如果 "Mac" 端点是 Stripe CLI 创建的，可能需要通过 CLI 删除：

```bash
# 1. 登录 Stripe CLI
stripe login

# 2. 列出所有端点
stripe webhook_endpoints list

# 3. 找到 "Mac" 端点的 ID (we_...)

# 4. 删除端点
stripe webhook_endpoints delete we_端点ID
```

---

## ✅ 方法 3: 等待自动过期

如果 "Mac" 端点是 Stripe CLI 本地监听器创建的：
- 它可能会在 Stripe CLI 进程停止后自动过期
- 等待几分钟让 Dashboard 更新
- 刷新页面查看状态

---

## 🔧 重新创建正确的端点

我已经创建了脚本帮你重新创建正确的端点。运行：

```bash
cd /Users/dallylovely/Desktop/Jie/AI/PetBlog/petblog
STRIPE_SECRET_KEY=sk_test_你的密钥 node recreate-webhook-endpoint.js
```

这会创建一个新的端点，描述为 "Pawstories edge functions"。

---

## ⚠️ 重要提示

删除 "Mac" 端点后：

1. **获取新的 Webhook Signing Secret**
   - 访问新创建的端点
   - 复制 Signing secret
   - 更新 Supabase Dashboard 中的 `STRIPE_WEBHOOK_SECRET`

2. **验证端点**
   - 确保只有一个 active 端点
   - 测试 webhook 签名验证
   - 检查错误率是否为 0%

---

**更新时间：** 2025-11-14

