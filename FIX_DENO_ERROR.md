# 🔧 修复 Deno.core.runMicrotasks() 错误

## 问题

函数运行时出现错误：
```
Error: Deno.core.runMicrotasks() is not supported in this environment
```

这是 Stripe SDK 在 Deno Edge Runtime 中的兼容性问题。

## 解决方案

已更新 Stripe SDK 的导入方式，添加了 `&no-check` 参数：

**之前**:
```typescript
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
```

**现在**:
```typescript
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno&no-check'
```

## 已更新的文件

- ✅ `supabase/functions/stripe-checkout/index.ts`
- ✅ `supabase/functions/stripe-webhook/index.ts`

## 下一步

1. **等待 10-30 秒**让部署生效

2. **测试订阅功能**：
   - 启动应用：`pnpm dev`
   - 访问订阅页面
   - 点击 "Subscribe Now"

3. **检查函数日志**：
   - https://supabase.com/dashboard/project/wqinxqlsmoroqgqpdjfk/functions/stripe-checkout/logs
   - 查看是否还有 `Deno.core.runMicrotasks()` 错误

## 如果问题仍然存在

如果错误仍然出现，可能需要：

1. **使用更旧的 Stripe SDK 版本**：
   ```typescript
   import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno&no-check'
   ```

2. **或者使用 npm: 前缀**：
   ```typescript
   import Stripe from 'npm:stripe@14.21.0'
   ```

3. **联系 Supabase 支持**，报告 Edge Runtime 兼容性问题

---

**请测试订阅功能，告诉我是否还有错误！**

