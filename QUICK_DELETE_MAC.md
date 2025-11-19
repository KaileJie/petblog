# 🚀 快速删除 "Mac" 端点

## 步骤 1: 获取 Stripe Secret Key

1. 打开浏览器，访问：**https://dashboard.stripe.com/apikeys**
2. 找到你的 **Secret key**（以 `sk_test_` 或 `sk_live_` 开头）
3. 点击 **"Reveal test key"** 或 **"Reveal live key"** 显示完整密钥
4. 复制整个密钥（包括 `sk_test_` 或 `sk_live_` 前缀）

---

## 步骤 2: 运行删除脚本

### 方法 A: 使用 Node.js 脚本（推荐）

```bash
cd /Users/dallylovely/Desktop/Jie/AI/PetBlog/petblog
STRIPE_SECRET_KEY=sk_test_你的密钥 node delete-mac-endpoint.js
```

### 方法 B: 使用 Bash 脚本

```bash
cd /Users/dallylovely/Desktop/Jie/AI/PetBlog/petblog
STRIPE_SECRET_KEY=sk_test_你的密钥 ./delete-mac-endpoint-simple.sh
```

---

## 📋 完整命令示例

假设你的密钥是 `sk_test_51ABC123...`，运行：

```bash
cd /Users/dallylovely/Desktop/Jie/AI/PetBlog/petblog
STRIPE_SECRET_KEY=sk_test_51ABC123... node delete-mac-endpoint.js
```

---

## ✅ 预期输出

脚本运行后，你应该看到：

```
🔍 Searching for "Mac" webhook endpoint...

📋 Fetching webhook endpoints...
Found 2 webhook endpoint(s):

Found "Mac" endpoint:
  ID: we_1234567890abcdef
  URL: https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook
  Status: enabled
  Description: Mac

🗑️  Deleting webhook endpoint: we_1234567890abcdef...
✅ Webhook endpoint deleted successfully!

✅ Success! The "Mac" endpoint has been deleted.

📋 Remaining endpoints:
  - we_abcdef1234567890: Pawstories edge functions (https://wqinxqlsmoroqgqpdjfk.supabase.co/functions/v1/stripe-webhook)
```

---

## 🔒 安全提示

- ⚠️ 密钥只会在当前命令中使用，不会保存
- ⚠️ 运行后可以清除终端历史（可选）
- ⚠️ 不要将密钥提交到 Git

---

准备好后，运行上面的命令即可！

