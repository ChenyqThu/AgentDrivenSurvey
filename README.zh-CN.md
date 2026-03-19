# Agent Driven Survey

[English](./README.md)

基于 LLM 的对话式调研平台，灵感来源于 [Anthropic Interviewer](https://github.com/anthropics/anthropic-cookbook)。管理员创建问卷，AI 构建智能调研 Agent，用户通过自然对话完成调研 —— 实时提取结构化数据。

## 核心特性

- **AI Agent 构建** — 两阶段流水线（Opus）：原始问卷 → 结构化 Schema → 访谈 Agent 配置（人设、技能、行为）
- **自然对话** — 用户通过聊天回答问题，而非填写表单。AI 访谈官自适应语气、智能追问、检测用户不耐烦
- **交互卡片** — NPS、评分、单选/多选、李克特量表、滑块、是/否卡片，内嵌在对话中渲染
- **实时数据提取** — 通过 `tool_use` 在对话过程中提取结构化数据，零额外 LLM 成本
- **Prompt 缓存** — System prompt 和 tools 跨轮次缓存（Anthropic 平台约 90% 成本节省）
- **Provider 抽象** — 支持 Anthropic 原生、Anthropic Messages（自定义代理）、OpenAI 兼容 API
- **动态 System Prompt** — 每轮重建，包含进度追踪、阶段感知、已提取数据上下文

## 系统架构

```
管理员上传问卷 + 背景上下文
  → Schema Agent（Opus）生成 SurveySchema
  → Config Agent（Opus）生成 prompt 模板 + 技能 + 行为配置
  → 管理员审核 & 发布 → 生成调研链接

用户打开 /s/[surveyId]
  → 创建 Session → 聊天 UI
  → 每条消息 → 动态 system prompt → Claude streaming + tool_use
  → extract_data / update_progress / render_interactive（用户不可见）
  → SSE 流式响应到前端
```

详见 [docs/architecture.zh-CN.md](./docs/architecture.zh-CN.md) 完整架构文档。

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Next.js 15（App Router）|
| 语言 | TypeScript |
| ORM | Drizzle ORM |
| 数据库 | PostgreSQL |
| LLM | Claude API（@anthropic-ai/sdk）|
| 样式 | Tailwind CSS v4 |

## 快速开始

### 前置条件
- Node.js 18+
- PostgreSQL
- Anthropic API key（或兼容代理）

### 安装

```bash
# 克隆仓库
git clone https://github.com/ChenyqThu/AgentDrivenSurvey.git
cd AgentDrivenSurvey

# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入数据库 URL 和 API key

# 推送数据库 schema
npm run db:push

# 启动开发服务器
npm run dev
```

### 环境变量

```env
# 数据库
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

## 开发命令

```bash
npm run dev          # 启动开发服务器（http://localhost:3000）
npm run build        # 生产构建
npm run db:push      # 推送 schema 到数据库
npm run db:generate  # 生成迁移文件
npm run db:studio    # 打开 Drizzle Studio
```

## 项目结构

```
src/
├── app/
│   ├── admin/              # 管理后台 & 问卷管理
│   ├── s/[surveyId]/       # 调研对话界面
│   └── api/                # 10 个 REST API 路由
├── lib/
│   ├── db/                 # Drizzle schema & 数据库连接
│   ├── llm/                # Provider 抽象层
│   │   ├── config.ts       # LLMConfig，provider 类型
│   │   ├── provider.ts     # LLMProvider 接口
│   │   ├── anthropic-provider.ts  # Anthropic SDK（缓存、重试）
│   │   └── openai-provider.ts     # OpenAI 兼容（fetch）
│   ├── survey/
│   │   ├── schema-generator.ts    # 阶段一：Schema Agent（Opus）
│   │   ├── agent-builder.ts       # 阶段二：Config Agent（Opus）
│   │   └── manager.ts             # 问卷 CRUD & 生命周期
│   └── conversation/
│       ├── engine.ts              # 核心对话引擎
│       ├── prompt-builder.ts      # 动态 system prompt
│       ├── state.ts               # 对话状态机
│       ├── tools.ts               # extract_data、update_progress
│       └── skills.ts              # 交互卡片定义
├── components/
│   ├── admin/              # 管理端 UI 组件
│   └── chat/               # 聊天组件 + 交互卡片
└── hooks/                  # useChat、useSurvey
```

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/surveys` | 创建问卷 + AI Agent 生成 |
| GET | `/api/surveys` | 问卷列表 |
| GET | `/api/surveys/[id]` | 问卷详情 |
| PUT | `/api/surveys/[id]/schema` | 更新 schema |
| POST | `/api/surveys/[id]/publish` | 发布问卷 |
| PATCH | `/api/surveys/[id]/status` | 更新状态 |
| POST | `/api/sessions` | 创建会话 |
| GET | `/api/sessions/[id]` | 获取/恢复会话 |
| POST | `/api/chat/[sessionId]` | 发送消息（SSE 流式）|
| GET | `/api/surveys/[id]/responses` | 获取响应数据 |
| GET | `/api/surveys/[id]/export` | 导出 CSV/JSON |

## 许可证

MIT
