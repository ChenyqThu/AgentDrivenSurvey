# Agent Driven Survey

## Project Overview
LLM-driven conversational survey system. Admin creates surveys → AI generates agent config → users complete surveys via natural conversation → real-time data extraction → structured reports.

## Tech Stack
- Next.js 15 (App Router) + TypeScript
- Drizzle ORM + PostgreSQL
- Claude API (@anthropic-ai/sdk) with OpenAI-compatible fallback
- Tailwind CSS v4

## Project Structure
```
src/
├── app/           # Next.js pages and API routes
│   ├── admin/     # Admin dashboard, survey management
│   ├── s/         # Survey chat interface (/s/[surveyId])
│   └── api/       # REST API endpoints
├── lib/
│   ├── db/        # Drizzle schema, migrations, connection
│   ├── llm/       # LLM provider abstraction (Anthropic + OpenAI-compatible)
│   ├── survey/    # Survey types, manager, schema generator
│   ├── conversation/ # Conversation engine, state machine, prompt builder, tools
│   └── analysis/  # Individual + aggregate analysis (Phase 2)
├── components/
│   ├── admin/     # Admin UI components
│   └── chat/      # Chat UI: messages, input, interactive cards
└── hooks/         # React hooks (useChat, useSurvey)
```

## Key Architecture Decisions
- **Dual-prompt architecture**: Separate prompts for schema generation (one-time) and interview (per-turn)
- **Real-time extraction via tool_use**: Zero extra LLM cost, extract_data + update_progress tools
- **Provider abstraction**: Support Anthropic native + OpenAI-compatible APIs via LLMConfig
- **Interactive cards**: render_interactive tool for NPS/rating/choice cards with callback
- **Prompt caching**: System prompt + tools cached across turns (90% cost reduction)
- **Full conversation history**: ~20 turns fits within 200K context, no truncation needed for MVP

## Development Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:push      # Push schema to database
npm run db:generate  # Generate migration files
npm run db:studio    # Open Drizzle Studio
```

## Environment Variables
```
DATABASE_URL         # PostgreSQL connection string
ANTHROPIC_API_KEY    # Anthropic API key (default provider)
LLM_PROVIDER         # 'anthropic' | 'openai-compatible' (default: anthropic)
LLM_BASE_URL         # Custom LLM endpoint URL
LLM_API_KEY          # Custom LLM API key (overrides ANTHROPIC_API_KEY)
LLM_MODEL            # Model identifier (default: claude-sonnet-4-20250514)
NEXTAUTH_SECRET      # NextAuth secret
NEXTAUTH_URL         # App URL for NextAuth
```

## Conventions
- Use `@/` import alias for src/ imports
- API routes use Next.js 15 async params: `{ params }: { params: Promise<{ id: string }> }`
- All DB operations use Drizzle ORM query builder
- JSONB fields cast via `as unknown as Record<string, unknown>` for TypeScript
- SSE streaming format: `data: {"type":"text|interactive_card|tool_use|done",...}\n\n`
- Interactive card interactions sent as structured JSON messages with `isCardInteraction: true`

## Testing
- Test with a real PostgreSQL database (no mocks)
- Use the `/admin/surveys/new` page to create test surveys
- Chat interface at `/s/[surveyId]` for end-to-end testing
