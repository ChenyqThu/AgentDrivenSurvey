# Agent Driven Survey

## 项目概述
基于 LLM 的对话式调研系统。管理员创建问卷 → AI 生成调研 Agent 配置 → 用户通过自然对话完成调研 → 实时数据提取 → 结构化报告 → 可选同步到 Notion。

## 技术栈
- Next.js 15（App Router）+ TypeScript
- Drizzle ORM + PostgreSQL
- Claude API（@anthropic-ai/sdk），支持 OpenAI 兼容回退
- Tailwind CSS v4
- @notionhq/client（Notion 集成）

## 项目结构
```
src/
├── app/           # Next.js 页面和 API 路由
│   ├── admin/     # 管理后台，问卷管理
│   ├── s/         # 调研对话界面（/s/[surveyId]）
│   └── api/       # REST API 端点
├── lib/
│   ├── db/        # Drizzle schema、migrations、数据库连接
│   ├── llm/       # LLM Provider 抽象层（Anthropic + OpenAI 兼容）
│   ├── survey/    # 问卷类型、管理器、schema 生成器、agent 构建器
│   ├── conversation/ # 对话引擎、状态机、prompt 构建器、tools、skills
│   ├── notion/    # Notion 集成（数据库创建、数据同步、对话记录导出）
│   └── analysis/  # 个体 + 聚合分析（Phase 2）
├── components/
│   ├── admin/     # 管理端 UI 组件
│   └── chat/      # 聊天 UI：消息、输入、交互卡片
└── hooks/         # React hooks（useChat、useSurvey）
docs/
└── survey-input-guide.md  # 系统设计思路与输入最佳实践指南
```

## 核心架构决策
- **两阶段 Agent 构建**：Schema Agent（结构化问卷）和 Config Agent（人设/技能/行为）独立运行，均使用 Opus 模型
- **实时 tool_use 提取**：零额外 LLM 成本，extract_data + update_progress + render_interactive 工具
- **Provider 抽象**：支持 anthropic / anthropic-messages（自定义代理）/ openai-compatible 三种 Provider
- **交互卡片系统**：render_interactive tool 渲染 NPS/评分/选择题等卡片，用户交互后回调
- **Prompt 缓存**：System prompt + tools 跨轮次缓存（约 90% 成本节省）
- **完整对话历史**：~20 轮 ≈ 20K tokens，200K 上下文限制内无需截断
- **Notion 同步**：会话完成后自动/手动同步结构化数据 + 对话记录到 Notion 数据库
- **会话完成检测**：所有问题 answered/skipped 后自动标记 session completed，触发 Notion 自动同步

## API 端点
```
POST   /api/surveys                      # 创建问卷
GET    /api/surveys/[id]                  # 获取问卷详情
POST   /api/surveys/[id]/schema           # 生成问卷 schema
POST   /api/surveys/[id]/publish          # 发布问卷
GET    /api/surveys/[id]/status           # 问卷状态
GET    /api/surveys/[id]/responses         # 问卷回复列表
GET    /api/surveys/[id]/export            # 导出数据
PUT    /api/surveys/[id]/notion            # 配置 Notion 集成
POST   /api/surveys/[id]/notion/sync       # 触发 Notion 同步
GET    /api/surveys/[id]/notion/status      # Notion 同步状态
POST   /api/sessions                      # 创建对话会话
GET    /api/sessions/[id]                  # 获取会话详情
POST   /api/chat/[sessionId]              # 发送消息（SSE 流式响应）
```

## 开发命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run db:push      # 推送 schema 到数据库
npm run db:generate  # 生成迁移文件
npm run db:studio    # 打开 Drizzle Studio
```

## 环境变量
```
DATABASE_URL         # PostgreSQL 连接字符串
LLM_PROVIDER         # 'anthropic' | 'anthropic-messages' | 'openai-compatible'（默认: anthropic）
LLM_BASE_URL         # 自定义 LLM 端点 URL
LLM_API_KEY          # LLM API key（覆盖 ANTHROPIC_API_KEY）
LLM_MODEL            # 模型标识（默认: claude-sonnet-4-6）
NEXTAUTH_SECRET      # NextAuth 密钥
NEXTAUTH_URL         # NextAuth 应用 URL
NOTION_API_TOKEN     # Notion API token（通过 ntn tokens create survey-sync --plain 生成）
```

## 代码规范
- 使用 `@/` 导入别名指向 src/
- API 路由使用 Next.js 15 异步参数：`{ params }: { params: Promise<{ id: string }> }`
- 所有数据库操作使用 Drizzle ORM query builder
- JSONB 字段通过 `as unknown as Record<string, unknown>` 进行 TypeScript 类型转换
- SSE 流式格式：`data: {"type":"text|interactive_card|tool_use|done",...}\n\n`
- 交互卡片回调以结构化 JSON 消息发送，携带 `isCardInteraction: true`

## 测试
- 使用真实 PostgreSQL 数据库测试（不使用 mock）
- 通过 `/admin/surveys/new` 页面创建测试问卷
- 在 `/s/[surveyId]` 进行端到端对话测试

# currentDate
Today's date is 2026-03-19.
