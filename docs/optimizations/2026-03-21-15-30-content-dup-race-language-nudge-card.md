# 优化记录：内容重复 / 双重开场竞态 / 语言不一致 / 卡片期间 Nudge

**发现时间**: 2026-03-21
**来源 Session**: b52d3822-3ee7-4ded-87ee-6f15ec07fd41

---

## Bug 1：LLM 内容重复（HIGH）

**现象**: seq=15、seq=21 消息内容中第一段重复出现两次，用户 seq=16 明确反馈 "这里触发后有消息重复了哦"。

**根因**: `engine.ts` continuation loop——当 LLM 第一轮输出不以 `?` 结尾时，把第一轮文本作为 assistant message 推入上下文，再发第二次 LLM 请求要求补问题。LLM 在回答前复述了开头句子，`allAssistantText += result.text` 直接拼接，导致重复内容存入 DB。

**修复**:
1. 新增 `deduplicateContinuation(accumulated, newText)` 函数：检测 newText 前缀是否在 accumulated 中已出现，若是则截断。
2. 续轮 prompt 改为更严格指令：`[INSTRUCTION: Output ONLY a single bare question sentence... No preamble, no repetition...]`
3. 拼接时对 `round > 1` 的输出先过 dedup：`allAssistantText += round > 1 ? deduplicateContinuation(...) : result.text`

**文件**: `src/lib/conversation/engine.ts`

---

## Bug 2：双重开场竞态（MEDIUM）

**现象**: session 出现两条 seq=1 的 assistant 消息，内容不同（两次不同的 opening）。

**根因**: `handleMessage` 中的 auto-start guard 在加载 history 后检查 `history.some(m => m.role === 'assistant')`。两个并发 `__START__` 请求同时加载空 history，都通过检查，各自运行 LLM 并写入 seq=1。TOCTOU 竞态。

**修复**: 在保存事务内再次检查是否已有 assistant 消息，若有则直接 return，不写入：
```ts
if (isAutoStart) {
  const [existing] = await tx.select(...).where(...role === 'assistant').limit(1);
  if (existing) return;
}
```

**文件**: `src/lib/conversation/engine.ts`

---

## Bug 3：语言声明不执行（MEDIUM）

**现象**: seq=11 AI 说"我跟着您切換！" 但同一条消息及后续全是繁体，直到 seq=24 才切换到简体。用户 seq=10~23 全部用简体输入。

**根因**: `soul.ts` 语言规则存在但不够强——规则说 "match the user's exact language variant" 和 "Never announce a switch and then fail to follow through"，但没有明确说明实际输入优先级高于声明偏好，LLM 坚持遵守 seq=8 的 "繁體中文" 声明。

**修复**: 加强 `soul.ts` 语言规则：
- "实际写作优先于声明偏好"
- "连续 2+ 条消息用不同变体写作时，立即切换"
- "宣布切换语言时，当前响应就必须已经是目标语言"

**文件**: `src/lib/conversation/prompts/soul.ts`

---

## Bug 4：卡片显示期间触发 Nudge（LOW）

**现象**: seq=1（含 yes_no 卡片）后，用户尚未点击，seq=2 和 seq=3 连续两条 nudge。

**根因**: `use-chat.ts` 的 `sendNudge` 只检查 `!userHasInteractedRef.current` 防止首次交互前 nudge，但开场 yes_no 卡片不算"用户发送消息"，所以在用户思考/点击卡片的 45s 等待期间 nudge 照常触发。

**修复**: `sendNudge` 中增加检查：若最后一条消息是 assistant 且含 cards，则跳过 nudge。

```ts
const hasPendingCard = lastMsg?.role === "assistant" && (lastMsg.cards?.length ?? 0) > 0;
if (hasPendingCard) return;
```

**文件**: `src/hooks/use-chat.ts`
