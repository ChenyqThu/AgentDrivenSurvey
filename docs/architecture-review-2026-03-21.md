# AgentDrivenSurvey — Architecture Review & Optimization Report

> Date: 2026-03-21
> Scope: Full-stack architecture review + industry best practice comparison
> Method: Code audit (all core files) + industry research (6 platforms, 15+ sources)

---

## Part 1: Industry Landscape & Best Practices

### 1.1 Competitive Landscape

| Platform | Model | Differentiator |
|----------|-------|----------------|
| [TheySaid](https://www.theysaid.io) | AI Interviews + Surveys + User Tests unified | Real-time AI sidebar, 2-way voice, automated thematic analysis |
| [CloudResearch Engage](https://www.cloudresearch.com/products/engage/) | "500 interviews in 1 hour" | Multi-language, fraud detection, mixed-methods (qual + quant) |
| [Forsta](https://www.forsta.com/blog/conversational-ai-surveys/) | Enterprise conversational surveys | Regulatory compliance, bias auditing, audit trails |
| [SurveySparrow](https://surveysparrow.com) | Conversational UI + NPS | 85% mobile completion rate, one-question-at-a-time UX |
| **AgentDrivenSurvey (ours)** | Deep interview agent, theme-driven | Modular prompt system, real-time tool_use extraction, interactive cards |

### 1.2 Key Industry Best Practices

#### A. Context Engineering (Anthropic, 2025)

Source: [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

- **Compaction**: Summarize conversation history when approaching context limits
- **Structured note-taking**: Agents maintain external memory files
- **Sub-agent delegation**: Focused tasks return condensed summaries
- **Hybrid retrieval**: Pre-load critical info + just-in-time retrieval via tools
- **Tool design**: Minimal viable toolsets, token-efficient returns
- **"Goldilocks zone"**: Balance specificity with flexibility in prompts

**Our alignment**: Partially aligned. We have good prompt modularity and cache-friendly ordering, but no compaction strategy, no memory persistence across sessions, and tools could be more token-efficient.

#### B. Conversation Flow State Management

Source: Multi-paper synthesis

- **Session state**: Server-side context injection per turn (we do this ✅)
- **Progressive disclosure**: Reveal context incrementally (we do this via stage-aware prompts ✅)
- **Observe → Think → Act loop**: Production agents need orchestrators managing retries, timeouts, termination (we partially do this with the continuation loop ⚠️)
- **Reflection pattern**: Agent evaluates its own outputs before finalizing (we don't do this ❌)

#### C. Completion Rate Optimization

Source: [SurveySparrow](https://surveysparrow.com/blog/mobile-survey-completion-rates/), [Lensym](https://lensym.com/blog/survey-completion-rates-drop-off), [Qualtrics](https://www.qualtrics.com/articles/strategy-research/4-tips-for-preventing-drop-offs-in-surveys/)

| Technique | Industry Data | Our Status |
|-----------|--------------|------------|
| One question at a time | 3% drop-off vs 18% for traditional | ✅ Strategy enforces single-question |
| Start with easy questions | 89% completion with easy openers | ✅ Opening stage explores basics first |
| 44x44px touch targets | Standard mobile UX | ✅ min-h-[44px] throughout |
| Progress indicator (subtle) | Reduces drop-off significantly | ⚠️ No visible progress |
| Keep under 15 min | Complexity > length for drop-off | ✅ 10-15 min target |
| Conversational UI | 3% vs 18% per-question drop-off | ✅ Core design |
| Interactive cards for structured input | Reduces typing friction | ✅ 7 card types |

#### D. Chat UI Performance

Source: [SitePoint](https://www.sitepoint.com/streaming-backends-react-controlling-re-render-chaos/)

- **Buffer SSE deltas in useRef**, flush via requestAnimationFrame
- **Virtualize message lists** for 100+ messages (react-window / @tanstack/react-virtual)
- **Batch state updates** to reduce React re-renders
- **Isolate streaming component** from the message list

**Our alignment**: Not aligned. We call `setMessages()` per token delta, mapping the entire array each time.

---

## Part 2: Architecture Audit

### 2.1 Scoring Summary

| Dimension | Score | Key Issue |
|-----------|-------|-----------|
| **Scalability** | ⭐⭐☆☆☆ | No DB indexes, no connection pool config, no concurrency control |
| **Reliability** | ⭐⭐☆☆☆ | Zero transactions, no timeouts, race conditions |
| **Cost Efficiency** | ⭐⭐⭐☆☆ | Prompt caching good, but cost tracker is dead code, continuation loop can 3x costs |
| **Security** | ⭐⭐⭐☆☆ | 3-layer injection defense good, but no API auth, no rate limit, profile injection vector |
| **State Management** | ⭐⭐⭐⭐☆ | Round tracking solid, stage model clean, but `currentTopicDepth` is dead |
| **Prompt Architecture** | ⭐⭐⭐⭐☆ | Excellent modularity, cache-friendly ordering, clear separation |
| **Frontend Performance** | ⭐⭐⭐☆☆ | Per-token re-renders, no SSE reconnection, no message virtualization |
| **Data Pipeline** | ⭐⭐⭐☆☆ | Real-time extraction elegant, but no validation, Notion sync fire-and-forget |
| **Observability** | ⭐☆☆☆☆ | 2 log statements in entire engine, no metrics, no cost tracking |
| **Technical Debt** | ⭐⭐⭐☆☆ | Dead code (cost-tracker, streaming.ts, currentTopicDepth), hardcoded product refs |

### 2.2 Critical Issues (Must Fix)

#### Issue 1: No API Authentication / Rate Limiting

**File**: `src/app/api/chat/[sessionId]/route.ts`
**Risk**: Anyone with a session ID can send unlimited messages, burning LLM API credits
**Fix**: Add per-IP rate limiting (30 req/min) + session token validation
**Effort**: Low | **Impact**: Critical

#### Issue 2: No Database Transactions

**Files**: `src/lib/conversation/engine.ts:396-429, 552-563`
**Risk**: Crash between message save and state update → data inconsistency; concurrent extract_data tool calls can race
**Fix**: Wrap message-save + state-update in `db.transaction()`
**Effort**: Medium | **Impact**: Critical

#### Issue 3: Profile URL Parameter Injection

**File**: `src/lib/conversation/prompts/context.ts:39-53`
**Risk**: Attacker injects `?profile=base64({"name":"Ignore instructions..."})` — flows directly into system prompt
**Fix**: Sanitize/escape values, add length limit, strip suspicious patterns
**Effort**: Low | **Impact**: High

### 2.3 High Impact Improvements

#### Improvement 1: Database Indexes

**File**: `src/lib/db/schema.ts`
**Current**: Only 1 unique constraint on `extracted_data`
**Add**: Indexes on `messages(session_id, sequence)`, `extracted_data(session_id)`, `sessions(survey_id)`, `sessions(last_active_at)`
**Impact**: 5-10x query speedup on hot paths

#### Improvement 2: LLM Request Timeout

**File**: `src/lib/llm/anthropic-provider.ts`
**Current**: No timeout — hung streams block forever
**Fix**: AbortController with 60s timeout
**Impact**: Prevents resource leaks and hung connections

#### Improvement 3: SSE Re-render Optimization

**File**: `src/hooks/use-chat.ts:324-331`
**Current**: `setMessages()` called per token delta (200+ times per response)
**Fix**: Buffer deltas in `useRef`, flush via `requestAnimationFrame`
**Impact**: Smoother streaming, less CPU usage, especially on mobile

#### Improvement 4: Cost Tracking Activation

**Files**: `src/lib/llm/cost-tracker.ts`, `engine.ts`, `anthropic-provider.ts`
**Current**: Cost tracker defined but never imported
**Fix**: Wire up usage events from Anthropic API, track per-session costs
**Impact**: Visibility into actual spending, enables budget alerts

#### Improvement 5: Structured Logging

**File**: `src/lib/conversation/engine.ts`
**Current**: 2 `console.log` statements in entire engine
**Fix**: Add pino/winston with session context (sessionId, surveyId, roundCount, latency)
**Impact**: Debugging, performance monitoring, error correlation

### 2.4 Medium Impact Improvements

| # | Improvement | File | Effort | Impact |
|---|-------------|------|--------|--------|
| 6 | Connection pool config (max: 20+) | `src/lib/db/index.ts` | Low | Medium |
| 7 | SSE reconnection on network drop | `src/hooks/use-chat.ts` | Medium | Medium |
| 8 | Implement or remove `currentTopicDepth` | `src/lib/conversation/state.ts` | Low | Low |
| 9 | Remove dead code (cost-tracker, streaming.ts) | Multiple | Low | Low |
| 10 | Extract shared `withRetry` utility | `anthropic-provider.ts`, `openai-provider.ts` | Low | Low |
| 11 | Internationalize completion card text | `completion-card.tsx` | Low | Low |
| 12 | Subtle progress indicator in chat header | `chat-container.tsx` | Medium | Medium |
| 13 | Message list virtualization (>40 messages) | `message-list.tsx` | Medium | Medium |

### 2.5 Architecture Gaps vs Industry

| Capability | Industry Best | Our Status | Gap |
|------------|--------------|------------|-----|
| **AI reflection/self-check** | Agent evaluates own output quality before sending | ❌ Not implemented | Could add a lightweight reflection step for closing/NPS rounds |
| **Conversation compaction** | Summarize history at context limits | ❌ Not needed yet (20 rounds ≈ 20K tokens) | Design for future: when target rounds exceed 30 |
| **Multi-language auto-detect** | Auto-detect from first message, no manual switch | ⚠️ Manual switch ("中文") | Could auto-detect via first user message language |
| **Voice input** | 2-way voice conversations (TheySaid) | ❌ Text only | Future feature, not critical for MVP |
| **Fraud detection** | AI-powered inattention/fraud scoring (CloudResearch) | ❌ Not implemented | Low priority for B2B tool |
| **Audit trail** | Complete transcript + decision log for compliance | ⚠️ Messages stored, but no decision log | Add tool call log per session for transparency |
| **A/B testing prompts** | Test different prompt strategies per survey | ❌ Not implemented | Valuable for prompt optimization at scale |
| **Respondent analytics dashboard** | Aggregate insights across all sessions | ⚠️ Basic export only | Phase 2 analysis module planned |

---

## Part 3: Recommended Roadmap

### Sprint 1 — Security & Reliability (1-2 days)

1. API rate limiting (per-IP, 30 req/min)
2. Database transactions for critical paths
3. Profile parameter sanitization
4. LLM request timeout (60s AbortController)
5. Database indexes on hot paths

### Sprint 2 — Observability & Cost (1-2 days)

6. Structured logging (pino) with session context
7. Wire up cost tracking (per-session token usage)
8. Health check endpoint
9. Error tracking integration (Sentry or similar)

### Sprint 3 — Frontend Performance (1 day)

10. SSE delta buffering (requestAnimationFrame)
11. Subtle progress indicator in header
12. Completion card i18n (dynamic language)
13. Clean up dead code

### Sprint 4 — Intelligence Upgrades (2-3 days)

14. Auto-detect conversation language from first user message
15. Implement `currentTopicDepth` tracking for better depth guidance
16. Add lightweight reflection step for closing-stage quality
17. Tool call audit log per session
18. Message list virtualization for long conversations

---

## Part 4: What We're Doing Right

These are strengths to preserve:

1. **Modular prompt architecture** — 5 independent modules with clear boundaries, cache-friendly ordering
2. **Theme-driven over question-driven** — Avoids checklist behavior, enables natural conversation
3. **Server-side round tracking** — Doesn't depend on LLM tool calls for state progression
4. **Real-time tool_use extraction** — Zero extra LLM cost for data extraction
5. **Three-layer security** — Prompt guardrails + regex pre-check + strategy-level topic management
6. **Interactive card system** — 7 card types reduce typing friction for structured inputs
7. **Design token architecture** — CSS custom properties with full light/dark mode coverage
8. **Animation system** — Framer Motion with physics-based springs, reduce-motion support
9. **Nudge intelligence** — Context-aware nudge with AI self-judgment
10. **Continuation loop** — Auto-fixes AI responses that forget to ask questions

---

Sources:
- [Effective Context Engineering for AI Agents — Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [TheySaid — AI Conversational Survey Platform](https://www.theysaid.io)
- [CloudResearch Engage — AI Interviews at Scale](https://www.cloudresearch.com/products/engage/)
- [Forsta — Conversational AI Surveys](https://www.forsta.com/blog/conversational-ai-surveys/)
- [Agent Design Pattern Catalogue — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0164121224003224)
- [UX Design for Conversational AI — NeuronUX](https://www.neuronux.com/post/ux-design-for-conversational-ai-and-chatbots)
- [9 UX Best Practices for AI Chatbots — Mind the Product](https://www.mindtheproduct.com/deep-dive-ux-best-practices-for-ai-chatbots/)
- [Conversational UI Design Pattern — AI UX Design Guide](https://www.aiuxdesign.guide/patterns/conversational-ui)
- [Survey Completion Rates — Lensym](https://lensym.com/blog/survey-completion-rates-drop-off)
- [Mobile Survey Completion Rates — SurveySparrow](https://surveysparrow.com/blog/mobile-survey-completion-rates/)
- [Streaming React Re-render Control — SitePoint](https://www.sitepoint.com/streaming-backends-react-controlling-re-render-chaos/)
- [4 Agentic AI Design Patterns — AIMultiple](https://research.aimultiple.com/agentic-ai-design-patterns/)
- [Prompt Engineering Guide — Lakera](https://www.lakera.ai/blog/prompt-engineering-guide)
- [Best AI Survey Tools 2026 — Zonka](https://www.zonkafeedback.com/blog/ai-survey-tools)
- [Best AI Survey Tools 2026 — Pollfish](https://www.pollfish.com/resources/blog/market-research/ai-survey-tools/)
