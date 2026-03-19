# Agent Driven Survey — System Architecture

[中文版](./architecture.zh-CN.md)

## 1. System Overview

### 1.1 Core Flow
Admin inputs questionnaire + context → **Schema Agent** (Opus) generates structured schema →
**Config Agent** (Opus) generates interview agent config → Publish survey link →
Users complete survey via natural conversation → Real-time structured data extraction → Analysis reports

### 1.2 Architecture Principles (ref: Anthropic Building Effective Agents)
- **Simplicity first**: Start with the simplest solution, add complexity only when it demonstrably improves results
- **Separation of concerns**: Schema generation vs interview conversation use independent prompt architectures
- **Progressive context**: Load only what's needed for the current step (Agent Skills three-tier disclosure model)
- **Tools as interfaces**: Tool definitions receive the same engineering effort as prompts
- **Composability**: Survey Agent = Prompt + Tools + Skills + Extraction Schema

## 2. LLM Integration Architecture

### 2.1 Provider Abstraction Layer
```
LLMConfig (per-survey or global)
  → createProvider(config)
    → AnthropicProvider    (native SDK, prompt caching, tool_use)
    → AnthropicMessages    (same SDK, custom baseURL for proxy/gateway)
    → OpenAIProvider       (fetch-based, compatible with third-party platforms)
```

Supported provider types:
| Provider | Description | Use Case |
|----------|-------------|----------|
| `anthropic` | Native Anthropic API | Direct API access |
| `anthropic-messages` | Anthropic SDK with custom baseURL | API proxy/gateway (e.g. `crs.chenge.ink`) |
| `openai-compatible` | OpenAI-compatible API | Third-party LLM platforms |

Custom `baseUrl` and `apiKey` can be configured globally (env vars) or per-survey (settings).

### 2.2 Prompt Caching Strategy (Anthropic)
- System prompt: 1-hour cache (stable across conversation turns)
- Tool definitions: 1-hour cache (stable across conversation turns)
- Conversation history: Auto-cached (incremental per turn)
- Cost reduction: Cache hits at 0.1x base input price ≈ ~90% savings

### 2.3 Model Routing
| Operation | Model | Rationale |
|-----------|-------|-----------|
| Schema Generation | Opus | One-time, needs deep understanding of questionnaire structure |
| Agent Config Building | Opus | One-time, needs nuanced persona & behavior design |
| Conversation Interview | Sonnet | High-frequency, needs speed + affordability |
| Data Extraction | Same as interview | tool_use, zero extra cost |
| Aggregate Analysis | Opus | One-time, needs deep synthesis |

## 3. Survey Agent System

### 3.1 Agent Definition
Each published survey is a complete Agent containing:
- **Survey Schema**: Structured questionnaire (sections → questions → extraction fields)
- **Interview Prompt Template**: AI-generated interview persona and conversation templates
- **Interactive Skills**: Renderable interactive card definitions (NPS, rating, choice, etc.)
- **Behavior Config**: Tone, follow-up depth, language, transition style
- **LLM Config**: Model selection and API configuration (optional per-survey override)

### 3.2 Two-Stage Agent Builder (AI-driven)

The agent building process is split into two independent AI agents for better separation of concerns:

**Stage 1 — Schema Agent** (`schema-generator.ts`)
```
Raw questionnaire text + Survey context
  → LLM Opus (create_survey_schema tool)
  → Output: SurveySchema
     ├── Sections (id, title, description, order)
     ├── Questions (id, text, type, required)
     ├── Follow-up Rules (condition, question, maxDepth)
     └── Extraction Fields (key, type, description)
```

**Stage 2 — Config Agent** (`agent-builder.ts`)
```
SurveySchema + Survey context
  → LLM Opus (build_agent_config tool)
  → Output:
     ├── Interview Prompt Template (role, opening, closing, custom rules)
     ├── Interactive Skills (which questions use cards, card types & config)
     └── Behavior Config (follow-up rounds, impatience detection, etc.)
```

**Why two agents?**
- Schema generation is a structural task (parsing, organizing, defining extraction)
- Config generation is a creative/behavioral task (persona design, UX decisions)
- Independent agents can be tested, iterated, and potentially run in parallel
- Each agent has a focused prompt → better output quality

### 3.3 Dynamic Prompt Building (rebuilt per turn)
```
System Prompt =
  [1] Role + Behavior Rules
  [2] Product Context
  [3] Survey Structure + Progress Markers ([✓] [~] [→] [ ])
  [4] Currently Active Question Details (follow-up rules, extraction fields)
  [5] Already Extracted Data (avoid re-asking)
  [6] Tool Use Instructions
  [7] Conversation Stage Awareness (Opening → Middle → Closing)
```

## 4. Interactive Card System (Interactive Skills)

### 4.1 Supported Card Types
| Type | Description | Use Case |
|------|-------------|----------|
| `nps` | NPS score 0-10 | Net Promoter Score surveys |
| `rating` | Star rating 1-5 | Satisfaction assessment |
| `multiple_choice` | Single select | Fixed-option questions |
| `multi_select` | Multi select | Multiple choice |
| `yes_no` | Yes/No | Binary judgment |
| `likert` | Likert scale | Attitude/agreement scales |
| `slider` | Slider | Numeric range input |

### 4.2 Interaction Flow
```
LLM calls render_interactive tool
  → Engine processes, sends card data via SSE
  → Frontend renders interactive card component
  → User interacts (click/select/slide)
  → Frontend sends structured callback
  → Engine formats as LLM message
  → LLM continues conversation
```

### 4.3 SSE Event Format
```json
// Text streaming
{"type": "text", "content": "..."}

// Interactive card
{"type": "interactive_card", "card": {"id": "card_1", "type": "nps", "question": "...", "config": {}}}

// Conversation end
{"type": "done"}
```

## 5. Data Flow Architecture

### 5.1 Real-time Data Extraction (tool_use, zero extra cost)
The LLM calls tools while generating its response:
- `extract_data`: Extract structured fields → upsert to extracted_data table
- `update_progress`: Update question status → update session.state
- `render_interactive`: Render interactive card → SSE push to frontend

### 5.2 Database Schema
```
admin_users ← surveys ← sessions ← messages
                   ↑         ↑
                   └── extracted_data
                   └── analysis_reports
```

**Table descriptions:**
- `admin_users`: Admin accounts (email + passwordHash)
- `surveys`: Survey definitions (rawInput + schema JSONB + settings JSONB + status)
- `sessions`: User sessions (state JSONB stores ConversationState)
- `messages`: Complete conversation history (role + content + sequence)
- `extracted_data`: Structured extraction results (sectionId + fieldKey + fieldValue JSONB, unique constraint on session+section+field)
- `analysis_reports`: Analysis reports (type: individual | aggregate)

### 5.3 Session State Machine
```
not_started → in_progress → answered
                           → skipped
            → abandoned (24h timeout)
```

**ConversationState fields:**
- `currentSectionIndex` / `currentQuestionIndex`: Current progress
- `followUpDepth`: Current follow-up depth
- `questionStates`: Per-question status (pending | in_progress | answered | skipped)
- `respondentInfo`: Respondent info (anonymous)

## 6. API Design
```
# Survey Management (Admin)
POST   /api/surveys                     Create survey + AI agent generation
GET    /api/surveys                     List surveys
GET    /api/surveys/[id]                Survey details
PUT    /api/surveys/[id]/schema         Update schema
POST   /api/surveys/[id]/publish        Publish
PATCH  /api/surveys/[id]/status         Status management

# Conversation (User)
POST   /api/sessions                    Create session
POST   /api/chat/[sessionId]            Send message (SSE streaming)
GET    /api/sessions/[id]               Resume session

# Data (Admin)
GET    /api/surveys/[id]/responses      Response list
GET    /api/surveys/[id]/export         Export CSV/JSON
```

## 7. Context Engineering Best Practices

Reference: Anthropic "Effective Context Engineering for AI Agents"

1. **Minimum high-signal tokens**: Include only information that influences model behavior
2. **Progressive disclosure**: Skills three-tier model — Discovery (name) → Core (SKILL.md) → Details (referenced files)
3. **Structured notes**: Use extracted_data as conversation's "external memory"
4. **Context erosion prevention**: 15-min conversation ≈ 20K tokens, well within 200K context limit
5. **Caching strategy**: Stable parts (system prompt + tools) cached, variable parts (messages) incremental

## 8. Security Design
- UUID links are unguessable
- Admin requires authentication (NextAuth.js v5)
- Respondents access anonymously (no login required)
- API Keys stored as environment variables (never in code)
- LLM calls isolated (each session has independent context)

## 9. Project Structure
```
src/
├── app/
│   ├── admin/           # Admin dashboard, survey management
│   ├── s/[surveyId]/    # Survey chat interface
│   └── api/             # REST API endpoints (10 routes)
├── lib/
│   ├── db/              # Drizzle schema, migrations, connection
│   ├── llm/             # Provider abstraction (Anthropic + OpenAI-compatible)
│   ├── survey/          # Types, manager, schema-generator, agent-builder
│   ├── conversation/    # Engine, state machine, prompt builder, tools, skills
│   └── analysis/        # Individual + aggregate analysis (Phase 2)
├── components/
│   ├── admin/           # Admin UI components
│   └── chat/            # Chat UI: messages, input, interactive cards
└── hooks/               # React hooks (useChat, useSurvey)
```
