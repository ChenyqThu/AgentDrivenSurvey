# 优化记录：Emoji 导致问题重复

**时间**: 2026-03-21 09:00
**触发**: 定期监控发现 Session 6d76cb7d [7] 中同一消息内问题重复

## 发现的问题

AI 回复 `...是新手用户还是老鸟？😄请问你大概用了多久...😊` — 同一条消息内出现两个近乎相同的问题。

## 根因分析

Continuation loop 的结尾问号检测正则 `/[?？]\s*$/` 要求问号在文本末尾。但 AI 文本以 emoji 结尾（`老鸟？😄`），正则不匹配 → loop 误判为"未提问" → 强制续一轮 → AI 重复了问题，两段拼接成一条消息。

## 修复

```diff
- const endsWithQuestion = /[?？]\s*$/.test(result.text.trim());
+ // Allow trailing emoji, punctuation, whitespace (up to 10 chars after ?)
+ const endsWithQuestion = /[?？][\s\S]{0,10}$/.test(result.text.trim());
```

将严格的"问号必须在末尾"放宽为"问号在最后 10 个字符内"，兼容 emoji、表情符号、省略号等常见 AI 输出尾缀。

## 其他观察（正面）

- 英文开场 + render_interactive 卡片 ✅
- 安全护栏：拒绝透露模型身份 ✅
- 离题处理：天气/边界问题均正确拉回 ✅
- Nudge 行为：两次 "不着急" check-in，未追加新问题 ✅

## 验证
- Build: ✅ 零错误
