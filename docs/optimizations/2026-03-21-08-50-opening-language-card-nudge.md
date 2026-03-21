# 优化记录：开场语言/卡片/Nudge 三重修复

**时间**: 2026-03-21 08:50
**触发**: 定期监控发现 Session b37c2300 存在 3 个问题

## 发现的问题

### 1. 开场仍为中文（高优先级）
- **表现**: AI 开场 "你好！我是小安（Ann）" 而非英文
- **根因**: 数据库 `promptTemplate.roleDescription` 包含中文 persona，覆盖了 soul.ts 的英文默认值；auto-start 指令虽说 "in English" 但不够强势
- **影响**: 所有使用该问卷的新会话

### 2. render_interactive 未实际调用（高优先级）
- **表现**: AI 文本中写 "点击下方按钮" 但没有调用 render_interactive 工具，用户看不到按钮
- **根因**: auto-start 指令仅说 "Use render_interactive"，AI 将其理解为可选建议

### 3. Nudge 追加新问题（中优先级）
- **表现**: 上一条 AI 消息以 "准备好了吗？" 结尾（已有问题），但 nudge 响应追加了新问题 "您是在手机上使用..."
- **根因**: continuation loop 的 "must end with question" 检查对 nudge 响应也生效，强制 AI 补问题

## 修复措施

### engine.ts — auto-start 指令强化
```diff
- '[System: ...Use render_interactive to provide a "ready to start" button.]'
+ '[System: ...You MUST do two things:
+  1. Deliver your opening in ENGLISH (not Chinese)
+  2. You MUST call render_interactive tool with card_type "yes_no"...
+  Do NOT just mention a button in text — you must actually call the tool.]'
```

### engine.ts — continuation loop 跳过 nudge
```diff
  if (result.text.trim()) {
+   if (isNudge) {
+     break; // nudge prompt handles its own logic
+   }
    const endsWithQuestion = ...
```

## 验证
- Build: ✅ 零错误
- 需要新会话验证开场效果（`?new=1`）
