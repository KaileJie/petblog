# 🐛 调试报告

## 发现的问题

### 1. ⚠️ Dashboard Page - useEffect 依赖项问题

**文件：** `app/dashboard/page.tsx`

**问题：**
```typescript
useEffect(() => {
  // ...
}, [sessionId, router, hasCheckedSessionId])
```

**潜在问题：**
- `router` 对象在每次渲染时可能变化，导致 useEffect 重复执行
- `hasCheckedSessionId` 在 useEffect 内部被设置，可能导致循环
- `router.replace('/dashboard')` 会触发页面重新渲染，可能再次触发 useEffect

**建议修复：**
- 移除 `router` 和 `hasCheckedSessionId` 从依赖项
- 使用 `useRef` 跟踪是否已检查过 session_id
- 在 `router.replace` 之前清理 URL 参数

---

### 2. ⚠️ Dashboard Page - 重定向循环风险

**文件：** `app/dashboard/page.tsx`

**问题：**
```typescript
router.replace('/dashboard')  // 第156行
```

**潜在问题：**
- 如果订阅查询失败或延迟，`router.replace('/dashboard')` 会移除 `session_id` 参数
- 移除参数后，middleware 会再次检查订阅
- 如果订阅还未保存，会重定向到 `/subscribe`
- 这可能导致循环：`/dashboard` → `/subscribe` → `/dashboard`

**建议修复：**
- 在重定向前确保订阅已保存
- 使用 `window.location.href` 强制刷新页面
- 或者增加更长的等待时间

---

### 3. ⚠️ Middleware - 订阅检查时机

**文件：** `lib/supabase/middleware.ts`

**问题：**
```typescript
if (!sessionId) {
  // 检查订阅
  if (!subscription) {
    redirect('/subscribe')
  }
}
```

**潜在问题：**
- 如果 `session_id` 被移除，middleware 会立即检查订阅
- 如果订阅还未保存（时序问题），会重定向到 `/subscribe`
- 这可能导致用户看到订阅页面，即使支付已完成

**建议修复：**
- 增加延迟或重试机制
- 或者完全依赖客户端验证，不在 middleware 中检查订阅

---

### 4. ⚠️ Subscribe Page - 重定向时机

**文件：** `app/subscribe/page.tsx`

**问题：**
```typescript
if (subscription) {
  router.replace('/dashboard')  // 第44行
  return
}
```

**潜在问题：**
- 如果用户刚完成支付，订阅可能还未保存
- 立即重定向到 `/dashboard` 可能导致循环
- 需要等待订阅保存完成

**建议修复：**
- 增加重试机制
- 或者等待更长时间

---

### 5. ✅ Validate Stripe Session - 看起来正确

**文件：** `supabase/functions/validate-stripe-session/index.ts`

**状态：** ✅ 代码看起来正确
- 使用 `upsert` 防止重复
- 有验证逻辑检查订阅是否保存
- 返回正确的响应

---

## 🔧 建议的修复方案

### 修复 1: Dashboard Page - 改进 useEffect

```typescript
const hasCheckedSessionIdRef = useRef(false)

useEffect(() => {
  // 防止重复检查
  if (hasCheckedSessionIdRef.current && !sessionId) {
    return
  }
  
  // ... 验证逻辑
  
  if (data?.success) {
    // 等待订阅保存
    // 使用 window.location.href 强制刷新
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 2000)
  }
}, [sessionId])  // 只依赖 sessionId
```

### 修复 2: Middleware - 增加延迟

```typescript
// 如果刚完成支付，给一些时间让订阅保存
const sessionId = request.nextUrl.searchParams.get('session_id')
if (!sessionId) {
  // 延迟检查订阅，给客户端验证时间
  // 或者完全跳过 middleware 的订阅检查
}
```

### 修复 3: Subscribe Page - 增加重试

```typescript
let retries = 3
while (retries > 0) {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()
  
  if (subscription) {
    router.replace('/dashboard')
    return
  }
  
  retries--
  await new Promise(resolve => setTimeout(resolve, 1000))
}
```

---

## 🎯 优先级

1. **高优先级：** Dashboard Page useEffect 依赖项问题
2. **高优先级：** 重定向循环风险
3. **中优先级：** Middleware 订阅检查时机
4. **低优先级：** Subscribe Page 重定向时机

---

## 📊 调试步骤

1. **检查浏览器控制台日志**
   - 查看 `console.log` 输出
   - 确认订阅查询是否成功
   - 确认重定向是否发生

2. **检查 Supabase Edge Function 日志**
   - 查看 `validate-stripe-session` 日志
   - 确认订阅是否成功保存
   - 检查是否有错误

3. **检查数据库**
   - 确认订阅记录是否存在
   - 确认 `user_id` 和 `status` 是否正确

4. **检查 RLS 策略**
   - 确认用户能否查询自己的订阅
   - 确认 Edge Function 能否写入订阅

---

**调试完成时间：** 2025-11-14

