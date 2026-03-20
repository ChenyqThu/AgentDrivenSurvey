# Agent Driven Survey

An LLM-powered **deep interview** platform. Instead of traditional form-based questionnaires, users have a natural 1-on-1 conversation with an AI interviewer who adapts in real-time — pursuing deep insights on 2-3 key pain points rather than mechanically covering 55 questions.

> **Depth over breadth.** One deep pain point is worth more than 55 shallow checkbox answers.

## Why This Exists

Traditional surveys get surface-level answers. Deep interviews get real insights — but don't scale. This system bridges the gap: each respondent gets a warm, adaptive conversation that feels like chatting with a researcher friend, while the backend extracts structured data automatically.

## How It Works

```
Admin creates questionnaire + context
  → AI generates interview agent (Opus, two-stage)
  → Publish survey link: /s/{surveyId}

User opens link
  → Warm welcome screen → Start conversation
  → AI conducts natural deep interview (~15 rounds)
  → Real-time structured data extraction (tool_use)
  → Session auto-completes → Optional Notion sync
```

## Key Features

| Feature | Description |
|---------|-------------|
| **Theme-driven conversations** | AI sees exploration directions, not a question checklist |
| **Modular prompt architecture** | 5 modules (guardrails / soul / strategy / themes / context) assembled per turn |
| **Round-based state tracking** | Server-side round counter, no dependency on AI calling tools |
| **Interactive cards** | NPS (0-10), star ratings, multiple choice, likert scales rendered inline |
| **User info import** | Pre-load respondent data via URL: `/s/{id}?profile=<base64json>` |
| **Idle nudge** | AI auto-follows up after 45s of silence (max 2 per session) |
| **Security guardrails** | 3-layer defense: prompt rules + regex pre-check + strategy guidance |
| **Prompt caching** | ~90% cost reduction via Anthropic cache |
| **Notion integration** | Auto-sync structured data + conversation transcript on completion |
| **New Chat** | One-click restart from header, no URL hacking needed |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    管理员创建问卷                         │
│              rawInput + SurveyContext                     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              两阶段 Agent 构建 (Opus)                     │
│  Schema Agent → Config Agent                             │
│  结构化问卷     人设 / 行为 / 交互卡片                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│               对话引擎 (Sonnet)                          │
│                                                          │
│  System Prompt = guardrails + soul + themes              │
│                + strategy + context                      │
│                                                          │
│  Tools:                                                  │
│    extract_data       → 实时提取结构化数据                │
│    conclude_interview → AI 主动结束访谈                   │
│    render_interactive → 渲染交互卡片 (NPS/评分/选择)      │
│                                                          │
│  State: round-based (roundCount / targetRounds / stage)  │
│  Security: 3-layer (prompt + regex + strategy)           │
│  Nudge: idle detection → auto follow-up                  │
│                                                          │
│  ┌─────────┐   SSE Stream   ┌─────────────────┐         │
│  │   LLM   │ ─────────────→ │  前端实时渲染     │         │
│  └─────────┘                └─────────────────┘         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                     数据存储                              │
│                                                          │
│  PostgreSQL                    Notion (可选)              │
│  ┌────────────────┐           ┌─────────────────────┐   │
│  │ sessions        │           │ 数据库（每会话一行）  │   │
│  │ messages        │    ──→    │ 对话记录（blocks）   │   │
│  │ extracted_data  │           │ 字段自动映射列类型    │   │
│  └────────────────┘           └─────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| AI | Claude API (@anthropic-ai/sdk), OpenAI-compatible fallback |
| Styling | Tailwind CSS v4 |
| Integration | @notionhq/client (Notion sync) |

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with DATABASE_URL, LLM_API_KEY, etc.

# Initialize database
npm run db:push

# Start dev server
npm run dev
```

Visit http://localhost:3000/admin to create a survey.

## Environment Variables

```bash
DATABASE_URL         # PostgreSQL connection string
LLM_PROVIDER         # 'anthropic' | 'anthropic-messages' | 'openai-compatible'
LLM_BASE_URL         # Custom LLM endpoint URL (for proxy/gateway)
LLM_API_KEY          # LLM API key (overrides ANTHROPIC_API_KEY)
LLM_MODEL            # Model identifier (default: claude-sonnet-4-6)
NEXTAUTH_SECRET      # NextAuth secret
NEXTAUTH_URL         # NextAuth app URL
NOTION_API_TOKEN     # Notion API token (optional)
```

## Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── admin/              # Admin dashboard
│   ├── s/[surveyId]/       # Survey conversation interface
│   └── api/                # REST API endpoints
├── lib/
│   ├── db/                 # Drizzle schema, migrations, connection
│   ├── llm/                # Provider abstraction (Anthropic + OpenAI-compatible)
│   ├── survey/             # Types, manager, schema generator, agent builder
│   ├── conversation/
│   │   ├── prompts/        # Modular prompt system (5 modules)
│   │   │   ├── guardrails.ts  # Security boundaries (highest priority)
│   │   │   ├── soul.ts        # Agent persona & communication style
│   │   │   ├── strategy.ts    # Interview methodology & pacing
│   │   │   ├── themes.ts      # Schema → exploration directions
│   │   │   └── context.ts     # Stage, progress, respondent info
│   │   ├── prompt-builder.ts  # Assembler
│   │   ├── engine.ts          # Conversation engine, SSE, tools, nudge
│   │   ├── state.ts           # Round-based state + legacy migration
│   │   ├── tools.ts           # LLM tool definitions
│   │   └── skills.ts          # Interactive card definitions
│   ├── notion/             # Notion integration
│   └── analysis/           # Analysis reports (Phase 2)
├── components/
│   ├── admin/              # Admin UI
│   └── chat/               # Chat UI: messages, cards, welcome, typing
└── hooks/                  # React hooks (useChat with nudge)
```

## API Endpoints

### Survey Management (Admin)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/surveys` | Create survey |
| GET | `/api/surveys/[id]` | Survey details |
| POST | `/api/surveys/[id]/schema` | Generate schema |
| POST | `/api/surveys/[id]/publish` | Publish |
| GET | `/api/surveys/[id]/responses` | Response list |
| GET | `/api/surveys/[id]/export` | Export data |

### Conversation (User)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sessions` | Create session (accepts `respondentInfo`) |
| GET | `/api/sessions/[id]` | Get session + history |
| POST | `/api/chat/[sessionId]` | Send message (SSE, supports `isNudge`) |

### Notion Integration
| Method | Path | Description |
|--------|------|-------------|
| PUT | `/api/surveys/[id]/notion` | Configure Notion page |
| POST | `/api/surveys/[id]/notion/sync` | Trigger sync |
| GET | `/api/surveys/[id]/notion/status` | Sync status |

## Notion Integration

1. Create a Notion Integration and get token: `ntn tokens create survey-sync --plain`
2. Add `NOTION_API_TOKEN=ntn_xxx` to `.env.local`
3. Create a Notion page and add the Integration
4. Configure via API: `PUT /api/surveys/{id}/notion` with `{"pageId": "...", "autoSync": true}`

Sessions auto-sync on completion when `autoSync` is enabled.

## Documentation

- [Architecture (EN)](docs/architecture.md) — Full system design
- [Architecture (中文)](docs/architecture.zh-CN.md) — 完整系统架构
- [Survey Input Guide](docs/survey-input-guide.md) — Questionnaire input best practices

## License

MIT
