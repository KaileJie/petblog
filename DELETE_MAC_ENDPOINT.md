# 🗑️ 删除 Stripe Dashboard 中的 "Mac" 端点

## 方法 1: 使用 Node.js 脚本（推荐）

### 步骤：

1. **获取你的 Stripe Secret Key**
   - 访问：https://dashboard.stripe.com/apikeys
   - 复制你的 **Secret key** (以 `sk_test_` 或 `sk_live_` 开头)

2. **运行删除脚本**
   ```bash
   cd /Users/dallylovely/Desktop/Jie/AI/PetBlog/petblog
   STRIPE_SECRET_KEY=sk_test_你的密钥 node delete-mac-endpoint.js
   ```

3. **脚本会自动：**
   - 列出所有 webhook endpoints
   - 找到 "Mac" 端点
   - 删除它
   - 显示剩余端点

---

## 方法 2: 使用 Bash 脚本

### 步骤：

1. **获取你的 Stripe Secret Key**
   - 访问：https://dashboard.stripe.com/apikeys
   - 复制你的 **Secret key**

2. **运行删除脚本**
   ```bash
   cd /Users/dallylovely/Desktop/Jie/AI/PetBlog/petblog
   export STRIPE_SECRET_KEY=sk_test_你的密钥
   ./delete-mac-endpoint.sh
   ```

---

## 方法 3: 使用 Stripe CLI（如果已安装）

### 步骤：

1. **登录 Stripe CLI**
   ```bash
   stripe login
   ```

2. **列出所有端点**
   ```bash
   stripe webhook_endpoints list
   ```

3. **找到 "Mac" 端点的 ID** (格式: `we_...`)

4. **删除端点**
   ```bash
   stripe webhook_endpoints delete we_你的端点ID
   ```

---

## 方法 4: 使用 cURL 直接调用 API

### 步骤：

1. **获取你的 Stripe Secret Key**

2. **列出所有端点**
   ```bash
   curl https://api.stripe.com/v1/webhook_endpoints \
     -u sk_test_你的密钥: \
     -H "Content-Type: application/x-www-form-urlencoded"
   ```

3. **找到 "Mac" 端点的 ID** (`we_...`)

4. **删除端点**
   ```bash
   curl -X DELETE https://api.stripe.com/v1/webhook_endpoints/we_你的端点ID \
     -u sk_test_你的密钥: \
     -H "Content-Type: application/x-www-form-urlencoded"
   ```

---

## ✅ 验证删除成功

删除后，验证：

1. **检查 Stripe Dashboard**
   - 访问：https://dashboard.stripe.com/webhooks
   - "Mac" 端点应该消失

2. **检查端点列表**
   - 应该只剩下 "Pawstories edge functions" 端点

3. **测试 Webhook**
   - 发送测试 webhook
   - 检查 Supabase Edge Function 日志
   - 确认签名验证成功

---

## 🔒 安全提示

- ⚠️ **不要提交 Secret Key 到 Git**
- ⚠️ **使用环境变量存储密钥**
- ⚠️ **删除后立即清除终端历史**（如果密钥在命令中）

---

**更新时间：** 2025-11-14

