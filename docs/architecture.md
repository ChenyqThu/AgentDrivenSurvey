# Agent Driven Survey — 系统架构文档

## 1. 系统概览

### 1.1 核心流程
管理员输入问卷+背景 → AI Agent Builder 生成完整调研 Agent → 发布链接 →
用户通过自然对话完成调研 → 实时结构化数据提取 → 分析报告

### 1.2 架构原则（参考 Anthropic Building Effective Agents）
- **简单优先**: 从最简单的方案开始，只在确实改善效果时增加复杂度
- **关注点分离**: Schema 生成 vs 对话访谈使用独立 prompt 架构
- **渐进式上下文**: 只加载当前必需的信息（Agent Skills 三级披露模型）
- **工具即接口**: Tool 定义投入与 prompt 同等的工程精力
- **可组合性**: Survey Agent = Prompt + Tools + Skills + Extraction Schema

## 2. LLM 集成架构

### 2.1 Provider 抽象层
```
LLMConfig (per-survey or global)
  → createProvider(config)
    → AnthropicProvider  (native SDK, prompt caching, tool_use)
    → OpenAIProvider     (fetch-based, compatible with third-party platforms)
```

支持自定义 baseUrl 和 apiKey，可在全局环境变量或每个 Survey 的 settings 中配置。

### 2.2 Prompt 缓存策略（Anthropic）
- System prompt: 1小时缓存（跨对话稳定）
- Tool definitions: 1小时缓存（跨对话稳定）
- Conversation history: 自动缓存（每轮递增）
- 成本降低: 缓存命中仅 0.1x 基础输入价格 = ~90% 节省

### 2.3 模型路由
| 操作 | 模型 | 原因 |
|------|------|------|
| Agent Builder（Schema+Prompt 生成）| Sonnet | 一次性，中等复杂度 |
| 对话访谈 | Sonnet | 高频，快+便宜 |
| 数据提取 | 同访谈 | tool_use，零额外成本 |
| 聚合分析 | Opus | 一次性，需深度综合 |

## 3. Survey Agent 体系

### 3.1 Agent 定义
每个发布的问卷是一个完整的 Agent，包含：
- **System Prompt Template**: AI 生成的访谈提示词模板
- **Survey Schema**: 结构化问卷定义（sections → questions → extraction fields）
- **Interactive Skills**: 可渲染的交互卡片定义（NPS、评分、选择题等）
- **Extraction Schema**: 数据提取字段和规则
- **Behavior Config**: 语气、追问深度、语言等行为配置
- **LLM Config**: 模型选择和 API 配置

### 3.2 Agent Builder 流程（AI 驱动）
```
原始问卷文本 + 背景上下文
  → LLM (create_survey_agent tool)
  → 输出:
     ├── SurveySchema (sections, questions, extraction fields)
     ├── Interview Prompt Template
     ├── Interactive Skills (哪些问题适合用卡片)
     └── Behavior recommendations
  → Admin 审核编辑
  → 发布
```

### 3.3 动态 Prompt 构建（每轮重建）
```
System Prompt =
  [1] Role + 行为约束
  [2] 产品背景上下文
  [3] 问卷结构 + 进度标记 ([✓] [~] [→] [ ])
  [4] 当前活跃问题详情（追问规则、提取字段）
  [5] 已提取数据（避免重复提问）
  [6] Tool 使用指令
  [7] 对话阶段感知（Opening → Middle → Closing）
```

## 4. 交互卡片系统（Interactive Skills）

### 4.1 支持的卡片类型
| 类型 | 描述 | 适用场景 |
|------|------|----------|
| `nps` | NPS 评分 0-10 | 净推荐值调研 |
| `rating` | 星级评分 1-5 | 满意度评估 |
| `multiple_choice` | 单选 | 固定选项问题 |
| `multi_select` | 多选 | 多项选择 |
| `yes_no` | 是/否 | 二元判断 |
| `likert` | 李克特量表 | 态度/同意度量表 |
| `slider` | 滑块 | 数值范围输入 |

### 4.2 交互流程
```
LLM 调用 render_interactive tool
  → Engine 处理，通过 SSE 发送卡片数据
  → 前端渲染交互卡片组件
  → 用户交互（点击/选择/滑动）
  → 前端发送结构化回调
  → Engine 格式化为 LLM 消息
  → LLM 继续对话
```

### 4.3 SSE 事件格式
```json
// 文本流
{"type": "text", "content": "..."}

// 交互卡片
{"type": "interactive_card", "card": {"id": "card_1", "type": "nps", "question": "...", "config": {}}}

// 对话结束
{"type": "done"}
```

## 5. 数据流架构

### 5.1 实时数据提取（tool_use 零额外成本）
LLM 在生成回复时同时调用工具：
- `extract_data`: 提取结构化字段 → upsert 到 extracted_data 表
- `update_progress`: 更新问题状态 → 更新 session.state
- `render_interactive`: 渲染交互卡片 → SSE 推送给前端

### 5.2 数据库 Schema
```
admin_users ← surveys ← sessions ← messages
                   ↑         ↑
                   └── extracted_data
                   └── analysis_reports
```

**表结构说明：**
- `admin_users`: 管理员账户（email + passwordHash）
- `surveys`: 问卷定义（rawInput + schema JSONB + settings JSONB + status）
- `sessions`: 用户会话（state JSONB 保存 ConversationState）
- `messages`: 完整对话历史（role + content + sequence）
- `extracted_data`: 结构化提取结果（sectionId + fieldKey + fieldValue JSONB，唯一约束 session+section+field）
- `analysis_reports`: 分析报告（type: individual | aggregate）

### 5.3 会话状态机
```
not_started → in_progress → answered
                          → skipped
           → abandoned (24h timeout)
```

**ConversationState 字段：**
- `currentSectionIndex` / `currentQuestionIndex`: 当前进度
- `followUpDepth`: 当前追问深度
- `questionStates`: 每道题的状态（pending | in_progress | answered | skipped）
- `respondentInfo`: 受访者信息（匿名）

## 6. API 设计
```
# 问卷管理 (Admin)
POST   /api/surveys                     创建问卷 + AI 生成 Agent
GET    /api/surveys                     列表
GET    /api/surveys/[id]                详情
PUT    /api/surveys/[id]/schema         更新 schema
POST   /api/surveys/[id]/publish        发布
PATCH  /api/surveys/[id]/status         状态管理

# 对话 (用户端)
POST   /api/sessions                    创建会话
POST   /api/chat/[sessionId]            发消息 (SSE 流式响应)
GET    /api/sessions/[id]               恢复会话

# 数据 (Admin)
GET    /api/surveys/[id]/responses      响应列表
GET    /api/surveys/[id]/export         导出 CSV/JSON
```

## 7. 上下文工程最佳实践

参考 Anthropic "Effective Context Engineering for AI Agents":

1. **最小高信号 Token 集**: 只包含影响模型行为的必要信息
2. **渐进式披露**: Skills 三级模型 — 发现(名称) → 核心(SKILL.md) → 细节(引用文件)
3. **结构化笔记**: 使用 extracted_data 作为对话的"外部记忆"
4. **上下文腐蚀防护**: 15分钟对话 ≈ 20K tokens，远小于 200K 上下文限制
5. **缓存策略**: 稳定部分（system prompt + tools）缓存，变化部分（messages）递增

## 8. 安全设计
- UUID 链接不可猜测
- 管理端需要认证（NextAuth.js v5）
- 受访者匿名访问（无需登录）
- API Key 不存储明文（环境变量或加密）
- LLM 调用隔离（每个 session 独立上下文）
