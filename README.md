# Agent Driven Survey

基于 LLM 的对话式调研系统。用 AI 替代传统表单，通过自然对话完成用户调研。

## 特性

- **对话式调研**：用户与 AI 访谈官自然对话，而非填写表单
- **两阶段 Agent 构建**：自动将问卷文本转化为结构化 schema + 访谈配置
- **实时数据提取**：通过 tool_use 在对话中零成本提取结构化数据
- **交互卡片**：NPS、评分、选择题等自动渲染为可交互 UI 组件
- **Notion 同步**：调研数据 + 完整对话记录自动同步到 Notion 数据库
- **多 Provider 支持**：Anthropic 直连 / 自定义代理 / OpenAI 兼容接口

## 架构

```
┌─────────────────────────────────────────────────────────┐
│                    管理员创建问卷                         │
│              rawInput + SurveyContext                     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              两阶段 Agent 构建 (Opus)                     │
│                                                          │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │   Schema Agent    │ →  │     Config Agent          │   │
│  │                   │    │                           │   │
│  │ • sections        │    │ • 访谈官人设               │   │
│  │ • questions       │    │ • 开场白/结束语            │   │
│  │ • extractionFields│    │ • 交互卡片分配             │   │
│  │ • followUpRules   │    │ • 行为规则                 │   │
│  └──────────────────┘    └──────────────────────────┘   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              SurveyAgent（可发布）                        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│               对话引擎 (Sonnet)                          │
│                                                          │
│  System Prompt = 角色 + 规则 + 进度 + 已提取数据          │
│                                                          │
│  Tools:                                                  │
│    extract_data       → 实时提取结构化数据                │
│    update_progress    → 更新问题完成状态                  │
│    render_interactive → 渲染交互卡片 (NPS/评分/选择)      │
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

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 15 (App Router) + TypeScript |
| 数据库 | PostgreSQL + Drizzle ORM |
| AI | Claude API (@anthropic-ai/sdk)，支持 OpenAI 兼容回退 |
| 样式 | Tailwind CSS v4 |
| 集成 | @notionhq/client (Notion API v5) |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`：

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_driven_survey
LLM_PROVIDER=anthropic
LLM_API_KEY=your-api-key
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# 可选：Notion 集成
NOTION_API_TOKEN=your-notion-token
```

### 3. 初始化数据库

```bash
npm run db:push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000/admin 创建问卷。

## 项目结构

```
src/
├── app/                  # Next.js 页面和 API 路由
│   ├── admin/            # 管理后台
│   ├── s/[surveyId]/     # 调研对话界面
│   └── api/              # REST API
│       ├── surveys/      # 问卷 CRUD + 发布 + Notion 集成
│       ├── sessions/     # 会话管理
│       └── chat/         # SSE 流式对话
├── lib/
│   ├── db/               # 数据库 schema + 连接
│   ├── llm/              # LLM Provider 抽象层
│   ├── survey/           # 问卷类型、schema 生成器、agent 构建器
│   ├── conversation/     # 对话引擎、状态机、tools、交互卡片
│   ├── notion/           # Notion 同步模块
│   │   ├── client.ts     # SDK 单例 + 429 重试
│   │   ├── schema-mapper.ts  # 提取字段 → Notion 列类型映射
│   │   ├── database.ts   # 创建/确保 Notion 数据库
│   │   ├── sync.ts       # 同步编排器
│   │   └── markdown.ts   # 对话记录 → Notion blocks
│   └── analysis/         # 分析报告（Phase 2）
├── components/           # React UI 组件
├── hooks/                # React hooks
docs/
└── survey-input-guide.md # 系统设计与输入最佳实践指南
```

## API 端点

### 问卷管理
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/surveys` | 创建问卷 |
| GET | `/api/surveys/[id]` | 获取问卷详情 |
| POST | `/api/surveys/[id]/schema` | 生成结构化 schema |
| POST | `/api/surveys/[id]/publish` | 发布问卷 |
| GET | `/api/surveys/[id]/status` | 问卷状态 |
| GET | `/api/surveys/[id]/responses` | 回复列表 |
| GET | `/api/surveys/[id]/export` | 导出数据 |

### Notion 集成
| 方法 | 路径 | 说明 |
|------|------|------|
| PUT | `/api/surveys/[id]/notion` | 配置 Notion 页面 |
| POST | `/api/surveys/[id]/notion/sync` | 触发同步（支持增量） |
| GET | `/api/surveys/[id]/notion/status` | 同步状态查询 |

### 对话
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/sessions` | 创建对话会话 |
| GET | `/api/sessions/[id]` | 获取会话详情 |
| POST | `/api/chat/[sessionId]` | 发送消息（SSE 流式响应） |

## Notion 集成

### 配置步骤

1. 创建 Notion Integration 并获取 token：
   ```bash
   ntn tokens create survey-sync --plain
   ```

2. 将 token 写入 `.env.local`：
   ```env
   NOTION_API_TOKEN=ntn_xxx
   ```

3. 在 Notion 中创建一个页面，将 Integration 添加到该页面

4. 通过 API 配置：
   ```bash
   curl -X PUT http://localhost:3000/api/surveys/{id}/notion \
     -H 'Content-Type: application/json' \
     -d '{"pageId": "your-page-id", "autoSync": true}'
   ```

### 同步内容

- **数据库**：每个提取字段映射为一列，每个会话写入一行
- **对话记录**：完整对话以引用块形式追加到每行数据的页面中
- **自动同步**：开启 `autoSync` 后，会话完成时自动同步（不阻塞对话响应）

### 字段映射

| 提取字段类型 | Notion 列类型 |
|-------------|--------------|
| `string` | Rich Text |
| `number` | Number |
| `boolean` | Checkbox |
| `string[]` | Multi Select |
| `object` | Rich Text (JSON) |

## 输入指南

详见 [docs/survey-input-guide.md](docs/survey-input-guide.md) — 包含系统设计思路、最佳输入原则和完整示例。

## License

MIT
