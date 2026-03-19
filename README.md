# Agent Driven Survey

[中文文档](./README.zh-CN.md)

An LLM-driven conversational survey platform inspired by [Anthropic Interviewer](https://github.com/anthropics/anthropic-cookbook). Admins create questionnaires, AI builds intelligent survey agents, and users complete surveys through natural conversation — with real-time structured data extraction.

## Features

- **AI Agent Builder** — Two-stage pipeline (Opus): raw questionnaire → structured schema → interview agent config (persona, skills, behavior)
- **Natural Conversation** — Users answer questions through chat, not forms. The AI interviewer adapts tone, follows up intelligently, and detects disengagement
- **Interactive Cards** — NPS, rating, multiple choice, Likert scale, slider, yes/no cards rendered inline in conversation
- **Real-time Extraction** — Structured data extracted via `tool_use` during conversation at zero extra LLM cost
- **Prompt Caching** — System prompt and tools cached across turns (~90% cost reduction on Anthropic)
- **Provider Abstraction** — Supports Anthropic native, Anthropic Messages (custom proxy), and OpenAI-compatible APIs
- **Dynamic System Prompt** — Rebuilt each turn with progress tracking, stage awareness, and extracted data context

## Architecture

```
Admin uploads questionnaire + context
  → Schema Agent (Opus) generates SurveySchema
  → Config Agent (Opus) generates prompt template + skills + behavior
  → Admin reviews & publishes → survey link generated

User opens /s/[surveyId]
  → Session created → Chat UI
  → Each message → dynamic system prompt → Claude streaming + tool_use
  → extract_data / update_progress / render_interactive (invisible to user)
  → SSE streaming response to frontend
```

See [docs/architecture.md](./docs/architecture.md) for the full architecture document.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| LLM | Claude API (@anthropic-ai/sdk) |
| Styling | Tailwind CSS v4 |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- Anthropic API key (or compatible proxy)

### Setup

```bash
# Clone
git clone https://github.com/ChenyqThu/AgentDrivenSurvey.git
cd AgentDrivenSurvey

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your database URL and API key

# Push database schema
npm run db:push

# Start dev server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_driven_survey

# LLM Provider: 'anthropic' | 'anthropic-messages' | 'openai-compatible'
LLM_PROVIDER=anthropic-messages
LLM_BASE_URL=https://your-api-proxy.com/api
LLM_API_KEY=your-api-key
LLM_MODEL=claude-sonnet-4-6

# NextAuth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

## Development Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run db:push      # Push schema to database
npm run db:generate  # Generate migration files
npm run db:studio    # Open Drizzle Studio
```

## Project Structure

```
src/
├── app/
│   ├── admin/              # Admin dashboard & survey management
│   ├── s/[surveyId]/       # Survey chat interface
│   └── api/                # 10 REST API routes
├── lib/
│   ├── db/                 # Drizzle schema & connection
│   ├── llm/                # Provider abstraction layer
│   │   ├── config.ts       # LLMConfig, provider types
│   │   ├── provider.ts     # LLMProvider interface
│   │   ├── anthropic-provider.ts  # Anthropic SDK (caching, retry)
│   │   └── openai-provider.ts     # OpenAI-compatible (fetch)
│   ├── survey/
│   │   ├── schema-generator.ts    # Stage 1: Schema Agent (Opus)
│   │   ├── agent-builder.ts       # Stage 2: Config Agent (Opus)
│   │   └── manager.ts             # Survey CRUD & lifecycle
│   └── conversation/
│       ├── engine.ts              # Core conversation engine
│       ├── prompt-builder.ts      # Dynamic system prompt
│       ├── state.ts               # Conversation state machine
│       ├── tools.ts               # extract_data, update_progress
│       └── skills.ts              # Interactive card definitions
├── components/
│   ├── admin/              # Admin UI components
│   └── chat/               # Chat components + interactive cards
└── hooks/                  # useChat, useSurvey
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/surveys` | Create survey + AI agent generation |
| GET | `/api/surveys` | List surveys |
| GET | `/api/surveys/[id]` | Survey details |
| PUT | `/api/surveys/[id]/schema` | Update schema |
| POST | `/api/surveys/[id]/publish` | Publish survey |
| PATCH | `/api/surveys/[id]/status` | Update status |
| POST | `/api/sessions` | Create session |
| GET | `/api/sessions/[id]` | Get/resume session |
| POST | `/api/chat/[sessionId]` | Send message (SSE) |
| GET | `/api/surveys/[id]/responses` | Get responses |
| GET | `/api/surveys/[id]/export` | Export CSV/JSON |

## License

MIT
