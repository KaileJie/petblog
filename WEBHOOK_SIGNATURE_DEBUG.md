# 🔍 Webhook 签名验证问题诊断

## 问题分析

从日志看，虽然 `STRIPE_WEBHOOK_SECRET` 已配置（38 字符），但签名验证仍然失败。

### 可能的原因

1. **Webhook Secret 值不匹配** ⚠️ **最可能**
   - Supabase Dashboard 中的 `STRIPE_WEBHOOK_SECRET` 可能与 Stripe Dashboard 中的 Signing secret 不一致
   - 即使长度相同，值可能不同

2. **Raw Body 被修改**
   - 虽然长度正确（5671 bytes），但内容可能在传输过程中被修改
   - 中间件或代理可能修改了请求体

3. **Signature Header 格式问题**
   - Signature header 格式可能不正确
   - 时间戳或签名部分可能缺失

---

## 🔧 已添加的调试功能

### 1. 详细的日志输出
- ✅ Signature header 完整内容
- ✅ Timestamp 提取
- ✅ 签名数量统计
- ✅ Raw body 首尾内容
- ✅ Webhook secret 格式验证

### 2. 格式验证
- ✅ 检查 webhook secret 是否以 `whsec_` 开头
- ✅ 检查 signature header 是否包含 `t=` 和 `v1=`
- ✅ 提供详细的故障排除步骤

---

## 📋 解决步骤

### 步骤 1: 验证 Stripe Dashboard 中的 Webhook Secret

1. 登录 Stripe Dashboard
2. 进入 **Developers** → **Webhooks**
3. 点击你的 webhook endpoint
4. 找到 **Signing secret** 部分
5. 点击 **Reveal** 显示完整 secret
6. 复制完整的 secret（应该以 `whsec_` 开头，约 38 字符）

### 步骤 2: 验证 Supabase Dashboard 中的 Secret

1. 登录 Supabase Dashboard
2. 进入 **Project Settings** → **Edge Functions** → **Secrets**
3. 找到 `STRIPE_WEBHOOK_SECRET`
4. 检查值是否与 Stripe Dashboard 中的完全一致

### 步骤 3: 常见问题检查

#### ❌ 问题 1: Secret 值不匹配
**症状：** Secret 长度相同，但值不同  
**解决：** 从 Stripe Dashboard 重新复制并粘贴到 Supabase Dashboard

#### ❌ 问题 2: 多余的空格或换行
**症状：** Secret 前后有空格或换行符  
**解决：** 确保复制时没有选中额外的空格，粘贴后检查

#### ❌ 问题 3: 使用了错误的 Secret
**症状：** 使用了旧的或测试环境的 secret  
**解决：** 确保使用当前 webhook endpoint 的 Signing secret

#### ❌ 问题 4: Secret 格式错误
**症状：** Secret 不以 `whsec_` 开头  
**解决：** 确保复制完整的 secret，包括 `whsec_` 前缀

---

## 🔍 查看新的调试日志

重新部署后，查看 Edge Function 日志，你会看到：

```
📥 Webhook received:
  - Signature header: t=1763175511,v1=2fda8d303b1879358b506451c0f1d9c4fc...
  - Timestamp from signature: 1763175511
  - Number of signatures: 1
  - Webhook secret format check: ✅ Correct
🔐 Attempting signature verification...
```

如果验证失败，会显示：
```
❌ Webhook signature verification failed
📋 Troubleshooting steps:
  1. Verify STRIPE_WEBHOOK_SECRET in Supabase Dashboard matches EXACTLY...
  2. In Stripe Dashboard: Webhooks > Your endpoint > Click "Reveal"...
  ...
```

---

## ✅ 验证清单

- [ ] Stripe Dashboard 中的 Signing secret 已复制
- [ ] Supabase Dashboard 中的 `STRIPE_WEBHOOK_SECRET` 已更新
- [ ] Secret 值完全一致（逐字符比较）
- [ ] Secret 以 `whsec_` 开头
- [ ] Secret 长度约 38 字符
- [ ] 没有多余的空格或换行
- [ ] Webhook function 已重新部署
- [ ] 从 Stripe Dashboard 发送了新的测试 webhook

---

## 🎯 下一步

1. **检查新的日志输出**，查看详细的调试信息
2. **对比 Stripe 和 Supabase 中的 secret 值**，确保完全一致
3. **如果仍然失败**，查看日志中的 troubleshooting steps

---

**更新时间：** 2025-11-14  
**状态：** ✅ 已添加详细调试功能

