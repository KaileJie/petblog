# 🔴 紧急修复：STRIPE_SECRET_KEY 未设置

## 问题确认

日志显示：
- ✅ `SUPABASE_URL` - 已设置
- ✅ `SUPABASE_ANON_KEY` - 已设置  
- ❌ `STRIPE_SECRET_KEY` - **未设置**

这说明环境变量系统正常工作，但 `STRIPE_SECRET_KEY` 在 Dashboard 中可能：
1. 没有设置
2. 名称不匹配
3. 值有问题

## 🚨 立即操作步骤

### 步骤 1: 访问 Secrets 页面

**直接打开：** https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/secrets

### 步骤 2: 检查 STRIPE_SECRET_KEY

1. **查看是否已存在**
   - 在 secrets 列表中查找 `STRIPE_SECRET_KEY`
   - 如果不存在，点击 "Add new secret"

2. **如果已存在，检查名称**
   - 点击 secret 查看/编辑
   - **确认名称完全匹配：** `STRIPE_SECRET_KEY`（全大写，下划线）
   - 不能是：`stripe_secret_key`、`STRIPE_SECRET_KEY `（有空格）、`STRIPE_SECRET_KEY`（有特殊字符）

3. **检查值**
   - 值应该以 `sk_test_` 或 `sk_live_` 开头
   - 值应该很长（100+ 字符）
   - 确保没有前后空格

### 步骤 3: 设置或更新 STRIPE_SECRET_KEY

**如果不存在或需要更新：**

1. **获取 Stripe Secret Key**
   - 访问：https://dashboard.stripe.com/test/apikeys
   - 找到 "Secret key"
   - 点击 "Reveal test key"
   - 复制完整值（以 `sk_test_` 开头）

2. **在 Dashboard 中设置**
   - 名称：`STRIPE_SECRET_KEY`（完全匹配）
   - 值：粘贴完整的 Stripe Secret Key
   - 保存

3. **验证设置**
   - 确认 secret 已出现在列表中
   - 确认名称是 `STRIPE_SECRET_KEY`（没有多余空格）

### 步骤 4: 重新部署函数

设置完成后，重新部署：

```bash
supabase functions deploy stripe-checkout
```

或者等待几秒钟让 Dashboard 的设置生效。

### 步骤 5: 测试

1. 刷新浏览器页面
2. 再次点击 "Subscribe Now"
3. 查看函数日志，应该看到：
   ```
   STRIPE_SECRET_KEY: ✅ Set
   ```

## 🔍 常见问题

### 问题 1: Dashboard 中看不到 STRIPE_SECRET_KEY
**解决：** 点击 "Add new secret"，名称输入 `STRIPE_SECRET_KEY`，值输入你的 Stripe Secret Key

### 问题 2: 名称不匹配
**解决：** 确保名称是 `STRIPE_SECRET_KEY`（全大写，下划线，没有空格）

### 问题 3: 值格式错误
**解决：** 确保值以 `sk_test_` 开头，是完整的 Secret Key（不是 Publishable Key `pk_`）

## ✅ 验证清单

在 Dashboard 的 Secrets 页面，确认：
- [ ] `STRIPE_SECRET_KEY` 存在
- [ ] 名称完全匹配：`STRIPE_SECRET_KEY`
- [ ] 值以 `sk_test_` 或 `sk_live_` 开头
- [ ] 值长度约 100+ 字符
- [ ] 值前后没有空格

---

**请立即在 Dashboard 中设置 `STRIPE_SECRET_KEY`，然后告诉我结果！**

