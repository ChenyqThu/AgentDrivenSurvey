# Optimization: Continuation Duplication, Language Matching, Auto-Start Guard

**Date:** 2026-03-21 14:00
**Session:** b52d3822-3ee7-4ded-87ee-6f15ec07fd41
**Status:** Fixed

## Issues Found

### 1. Content Duplication in Continuation Loop (HIGH)

**Symptom:** seq=15 and seq=21 had repeated first sentences. User explicitly reported at seq=16.

**Root Cause:** When AI response didn't end with a question, the continuation loop:
1. Streamed first response to frontend via SSE
2. Asked AI to retry with a question
3. Streamed second response (often repeating the first) to frontend
4. Frontend accumulated BOTH via `accumulated += event.content`
5. Backend stored BOTH via `allAssistantText += result.text`

**Fix (engine.ts + use-chat.ts):**
- Changed `allAssistantText += result.text` to `allAssistantText = result.text` — only keep the final round
- Send `{ type: 'text_reset' }` SSE event before each continuation retry
- Frontend handles `text_reset` by clearing accumulated text and resetting displayed content
- Changed continuation prompt to "Rewrite your ENTIRE response" instead of "do NOT repeat"

### 2. Duplicate Opening Messages (HIGH)

**Symptom:** Two assistant messages at seq=1 — both are opening messages with slightly different content.

**Root Cause:** No backend guard against duplicate `__START__` requests. If the frontend sends `__START__` twice (page refresh during streaming, React StrictMode edge case), both produce opening messages at seq=1.

**Fix (engine.ts):**
- Added early return in `handleMessage`: if `isAutoStart` and history already contains assistant messages, return an empty stream with `{ type: 'done' }`

### 3. Language Inconsistency (MEDIUM)

**Symptom:** AI said "我跟著您切換" (switching to simplified Chinese) at seq=11 but continued using traditional Chinese in ALL subsequent messages (seq=13, 15, 17, 19, 21). User consistently wrote simplified Chinese.

**Root Cause:** No explicit language matching instruction in the prompt system. The AI defaulted to traditional Chinese (common for models) despite the user writing simplified.

**Fix (soul.ts):**
- Added "Language Matching" section: explicit instruction to mirror the user's exact language variant (simplified/traditional Chinese, Japanese, etc.)

## Non-Issues

- **Question quality:** Every exploring message ended with a question mark
- **Card usage:** Opening button (yes_no) and choice card (multiple_choice) used appropriately
- **Interview rhythm:** Good 共鸣→观察→提问 pattern from seq=11 onward
- **Nudge before interaction:** Current code has `userHasInteractedRef` guard; the session predates this fix

## Files Modified

- `src/lib/conversation/engine.ts` — text_reset SSE, allAssistantText replace, auto-start guard
- `src/hooks/use-chat.ts` — handle text_reset event
- `src/lib/conversation/prompts/soul.ts` — language matching instruction
