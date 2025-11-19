# 检查最新函数日志

## 当前状态
仍然出现 500 错误，需要查看最新的函数日志来确定具体问题。

## 查看日志步骤

1. **访问函数日志页面**
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs

2. **查找最新的错误日志**
   - 查看最新的红色错误条目
   - 查找 "Stripe initialization error" 或类似错误
   - 查看 "Stripe key check:" 的输出

3. **检查关键信息**
   - `hasSTRIPE_SECRET_KEY` 的值（应该是 `true`）
   - `hasSupabaseUrl` 和 `hasSupabaseAnonKey` 的值
   - 任何错误消息

## 可能的问题

### 如果日志显示 `hasSTRIPE_SECRET_KEY: false`
- Secrets 可能还没有通过 Dashboard 设置
- 或者名称不匹配
- 需要确认 Dashboard 中的 secrets 已正确设置

### 如果日志显示 `hasSTRIPE_SECRET_KEY: true` 但仍有错误
- 可能是 Stripe key 格式错误
- 或者 Stripe API 调用失败
- 需要查看具体的错误消息

## 下一步

请将最新的函数日志（特别是错误日志）发给我，我会根据具体错误继续修复。

