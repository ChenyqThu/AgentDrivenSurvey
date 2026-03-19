# Agent Driven Survey — 系统设计与输入指南

## 一、系统设计思路

### 1.1 核心理念

传统问卷是「填表」，本系统是「对话」。

用户不再面对冰冷的表单，而是与一个具有专业人设的 AI 访谈官进行自然对话。系统在对话过程中**实时提取结构化数据**，零额外成本、零后处理延迟。

### 1.2 两阶段 Agent 构建

一份问卷从输入到可用，经历两次 LLM 处理：

```
原始问卷文本 + 调研背景
        │
        ▼
┌─────────────────────┐
│  Schema Agent (Opus) │  → 结构化问卷：sections / questions / extractionFields / followUpRules
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Config Agent (Opus) │  → 访谈配置：人设 / 开场白 / 交互卡片 / 行为规则
└─────────────────────┘
        │
        ▼
   完整的 SurveyAgent（可发布）
```

**Schema Agent** 负责「理解问卷结构」：
- 将自由文本拆分为逻辑板块（sections）
- 识别问题类型（开放式 / 评分 / 选择 / 是否）
- 为每个问题定义**数据提取字段**（extractionFields）—— 告诉运行时「这个问题要提取什么数据、什么类型」
- 生成**追问规则**（followUpRules）—— 在什么条件下自动追问、追问什么

**Config Agent** 负责「设计访谈体验」：
- 根据产品和用户画像生成**访谈官人设**（不是通用的"我是 AI 助手"，而是"我是 XX 产品的用户研究员"）
- 为评分 / NPS / 选择题等分配**交互卡片**（用户直接点击而非打字）
- 设置行为参数：追问深度、是否检测用户不耐烦、板块过渡风格

### 1.3 运行时架构

```
用户输入
  │
  ▼
┌──────────────────────────────────────────┐
│            Conversation Engine            │
│                                          │
│  System Prompt（角色 + 规则 + 进度 +     │
│               已提取数据 + 当前问题）      │
│                                          │
│  Tools:                                  │
│    extract_data      → 实时提取数据       │
│    update_progress   → 更新问题进度       │
│    render_interactive → 弹出交互卡片      │
│                                          │
│  SSE Stream → 前端实时渲染               │
└──────────────────────────────────────────┘
  │
  ▼
数据库存储（messages / extractedData / sessions）
  │
  ▼
可选：自动同步到 Notion
```

关键设计：
- **零额外提取成本**：数据提取通过 tool_use 在对话中实时完成，不需要额外的 LLM 调用
- **完整对话历史**：每轮对话都带完整历史（~20 轮 ≈ 20K tokens，在 200K 上下文限制内）
- **Prompt 缓存**：System prompt + tools 定义跨轮次缓存，节省约 90% 成本
- **进度感知**：System prompt 动态注入当前进度、已提取数据、活跃问题，LLM 始终知道「该聊什么」

### 1.4 数据流

```
对话中 LLM 调用 extract_data tool
  → 写入 extracted_data 表（sectionId + fieldKey + value + confidence）
  → 同一字段多次提取时自动更新（upsert）

对话完成（所有问题 answered/skipped）
  → session 标记为 completed
  → 若配置了 Notion autoSync → 异步同步到 Notion 数据库
```

---

## 二、输入结构

系统接受两部分输入：**原始问卷文本**（rawInput）和**调研背景**（SurveyContext）。

### 2.1 原始问卷文本（rawInput）

纯文本，格式自由。LLM 会自动理解结构。但遵循以下原则可以显著提升生成质量：

| 原则 | 做法 | 效果 |
|------|------|------|
| 用 `##` 分隔板块 | `## 基本信息`、`## 产品使用` | LLM 精确映射为 sections |
| 括号标注选项 | `（18-25 / 26-35 / 36-45）` | 识别为 multiple_choice 类型 |
| 括号标注评分范围 | `（1-10 分）` | 识别为 rating 类型，自动生成交互卡片 |
| 不加选项 = 开放式 | `您觉得最需要改进的是什么？` | 识别为 open_ended，保留自由回答 |
| 编号有助于排序 | `1. 2. 3.` 或 `- ` | 保持问题顺序 |
| 标注必答/可选 | `（必答）` 或 `（可选）` | 映射为 required 字段 |

### 2.2 调研背景（SurveyContext）

```typescript
interface SurveyContext {
  product: string;        // 产品/服务名称
  targetUsers: string;    // 目标用户画像
  focusAreas: string[];   // 调研重点领域
  additionalContext?: string; // 补充背景信息
}
```

**这是影响生成质量最关键的部分。** Context 越具体，生成的：
- 访谈官人设越贴合（"资深游戏用户研究员" vs "AI 助手"）
- 追问规则越精准（知道什么值得追问）
- 交互卡片配置越合理（知道评分范围该用 NPS 还是 5 星）
- 自定义行为规则越有针对性

### 2.3 调研设置（SurveySettings）

```typescript
interface SurveySettings {
  maxDurationMinutes: number;  // 预计时长（分钟）
  language: string;            // 语言代码：'zh' / 'en' / 'ja' 等
  tone: 'formal' | 'casual' | 'neutral'; // 语气风格
}
```

---

## 三、最佳输入实践

### 3.1 基础示例 — 产品满意度调研

**SurveyContext:**
```json
{
  "product": "FocusFlow — 番茄钟专注力 App",
  "targetUsers": "每天使用 App 超过 30 分钟的活跃用户",
  "focusAreas": ["核心功能满意度", "付费意愿", "竞品对比"],
  "additionalContext": "产品刚完成 3.0 大版本更新，新增了 AI 专注建议功能"
}
```

**rawInput:**
```
## 使用概况
1. 您使用 FocusFlow 多久了？（不到1个月 / 1-3个月 / 3-6个月 / 半年以上）
2. 您平均每天使用多长时间？
3. 您最常在什么场景下使用？（工作 / 学习 / 阅读 / 运动 / 其他）

## 功能评价
4. 请给 FocusFlow 的整体体验打分（1-10 分）
5. 您最常用的三个功能是什么？
6. 3.0 版本新增的 AI 专注建议功能，您体验过吗？感受如何？
7. 有没有哪个功能让您觉得特别好用？为什么？
8. 有没有哪个功能让您觉得需要改进？具体是什么问题？

## 付费与推荐
9. 您目前是免费用户还是付费用户？
10. 如果 Pro 版定价 ¥12/月，您的付费意愿如何？（1-5 分）
11. 您会向朋友推荐 FocusFlow 吗？（0-10 NPS）
12. 如果会，您会怎么向朋友介绍这款产品？
```

**效果解析：**
- `##` 自动生成 3 个 section：使用概况 / 功能评价 / 付费与推荐
- 问题 1、3 → `multiple_choice`，自动生成选项卡片
- 问题 4 → `rating`（1-10），生成评分卡片
- 问题 10 → `rating`（1-5），生成 slider 卡片
- 问题 11 → `nps`（0-10），生成 NPS 专用卡片
- 问题 5、6、7、8、12 → `open_ended`，保留自由对话 + 自动追问
- `additionalContext` 中提到 3.0 更新，LLM 会在问题 6 触发更深入的追问规则

---

### 3.2 深度访谈示例 — B2B SaaS 客户流失分析

**SurveyContext:**
```json
{
  "product": "DataPipe — 企业数据管道平台",
  "targetUsers": "过去 90 天内降级或取消订阅的企业客户（决策者或主要使用者）",
  "focusAreas": ["流失原因", "竞品迁移", "挽回可能性", "产品短板"],
  "additionalContext": "近3个月客户流失率从5%升至12%，主要集中在中型客户（年费5-20万）。竞品 StreamSet 最近推出了低价方案。"
}
```

**rawInput:**
```
## 使用回顾
1. 您的团队使用 DataPipe 多长时间了？
2. 主要用 DataPipe 解决什么业务问题？
3. 团队中有多少人日常使用？

## 决策过程
4. 是什么让您开始考虑更换/停用 DataPipe 的？（必答）
5. 这个决定是您个人做的，还是团队/管理层共同决定的？
6. 从开始考虑到最终决定，大概经历了多长时间？

## 具体原因
7. 请选择最主要的流失原因（可多选）：
   - 价格太高 / 性价比不够
   - 功能不满足需求
   - 产品稳定性/性能问题
   - 技术支持响应慢
   - 竞品方案更好
   - 业务方向调整，不再需要
   - 其他
8. 能详细说说具体遇到了什么问题吗？（必答）
9. 在使用期间，有没有向我们反馈过这些问题？结果如何？

## 竞品对比
10. 您是否已经在使用或评估其他产品？是哪些？
11. 相比 DataPipe，新方案最吸引您的是什么？
12. 新方案有没有不如 DataPipe 的地方？

## 挽回可能
13. 如果我们解决了您提到的问题，您会考虑重新使用吗？（1-5 意愿度）
14. 具体需要改进什么，您才会重新考虑？
15. 对我们的产品团队，您还有什么想说的？
```

**Settings 建议:**
```json
{
  "maxDurationMinutes": 20,
  "language": "zh",
  "tone": "formal"
}
```

**效果解析：**
- 流失分析需要深度追问 → Config Agent 会设置较高的 `maxFollowUpRounds`（3）和 `adaptiveDepth: true`
- 问题 4、8 标注必答 → `required: true`，Agent 不会允许跳过
- 问题 7 多选 → `multi_select` 卡片，方便快速选择后再追问细节
- 问题 13 → `rating` 卡片（1-5 意愿度）
- `additionalContext` 提到竞品 StreamSet → LLM 会在问题 10-12 中特别关注 StreamSet，生成追问规则如"如果提到 StreamSet，追问其低价方案的具体吸引力"
- `targetUsers` 指明是"决策者或主要使用者" → 人设会调整为更商务的沟通风格

---

### 3.3 快速反馈示例 — 活动/功能上线后即时收集

**SurveyContext:**
```json
{
  "product": "线上黑客松活动 — HackWeek 2025",
  "targetUsers": "刚参加完活动的参赛者",
  "focusAreas": ["活动体验", "组织质量", "改进建议"],
  "additionalContext": "首次举办线上赛，共 200 支队伍参赛，为期 48 小时"
}
```

**rawInput:**
```
## 整体评价
1. 整体活动体验打分（1-10）
2. 您会推荐朋友参加下一届吗？（0-10 NPS）
3. 用三个词形容这次活动

## 环节评价
4. 开幕式 / 导师辅导 / 中期检查 / 最终展示，哪个环节最好？哪个最需要改进？
5. 线上协作工具好用吗？遇到什么问题？

## 改进建议
6. 如果只能改一件事，您最希望改什么？
7. 还有其他想说的吗？
```

**Settings 建议:**
```json
{
  "maxDurationMinutes": 5,
  "language": "zh",
  "tone": "casual"
}
```

**效果解析：**
- 短时长 + casual 语气 → Config Agent 生成轻松友好的人设，追问深度较浅（1-2 轮）
- `transitionStyle` 会设为 `direct`（直接过渡，不啰嗦）
- 问题 1 → `rating` 卡片，问题 2 → `nps` 卡片 —— 用户点两下就完成
- 问题 3 虽然简短但是 `open_ended`，保留自由发挥空间
- 只有 7 个问题，适合活动结束后快速填写

---

### 3.4 英文示例 — SaaS Onboarding Experience

**SurveyContext:**
```json
{
  "product": "Notecraft — AI-powered note-taking app",
  "targetUsers": "Users who completed onboarding in the last 7 days",
  "focusAreas": ["onboarding clarity", "time to value", "feature discovery"],
  "additionalContext": "We recently redesigned the onboarding flow from 5 steps to 3 steps. Want to measure if it improved."
}
```

**rawInput:**
```
## First Impressions
1. How did you first hear about Notecraft?
2. What made you decide to sign up?
3. Rate your first impression of the app (1-5 stars)

## Onboarding Experience
4. How easy was the onboarding process? (1-10)
5. Was there any step that felt confusing or unnecessary?
6. How long did it take you to feel comfortable using the app? (Less than 5 min / 5-15 min / 15-30 min / More than 30 min)

## Feature Discovery
7. Which features have you tried so far?
8. Is there a feature you expected but couldn't find?
9. What's the one thing that makes you want to keep using Notecraft?

## Overall
10. How likely are you to recommend Notecraft to a colleague? (0-10 NPS)
11. Any other feedback for our team?
```

---

## 四、输入质量自查清单

在提交问卷之前，检查以下要点：

### 问卷文本（rawInput）
- [ ] 用 `##` 分隔了逻辑板块（3-5 个板块为佳）
- [ ] 每个板块 2-5 个问题（过少则板块无意义，过多则受访者疲劳）
- [ ] 评分/NPS 类问题标注了分值范围：`（1-10）`、`（0-10 NPS）`、`（1-5 星）`
- [ ] 选择题在括号内列出了选项：`（选项A / 选项B / 选项C）`
- [ ] 关键问题标注了`（必答）`
- [ ] 开放式问题没有加选项（让 LLM 通过对话自由探索）
- [ ] 总问题数控制在 8-15 个（5 分钟 ≈ 6-8 题，20 分钟 ≈ 12-15 题）
- [ ] 问题之间有逻辑递进（先具体后抽象、先事实后观点）

### 调研背景（SurveyContext）
- [ ] `product`：写了具体的产品名 + 一句话描述（不是"我们的产品"）
- [ ] `targetUsers`：明确描述了用户画像（不是"所有用户"）
- [ ] `focusAreas`：列出了 2-4 个具体调研重点（不是"了解用户想法"）
- [ ] `additionalContext`：补充了时间节点、背景事件、竞品信息等（如有）

### 设置（Settings）
- [ ] `maxDurationMinutes`：与问题数量匹配
- [ ] `language`：与问卷文本语言一致
- [ ] `tone`：与目标用户匹配（企业客户 → formal，C 端用户 → casual）

---

## 五、问题类型与交互卡片映射

系统支持以下问题类型，不同类型决定了用户的交互方式：

| 问题类型 | 识别线索 | 交互方式 | 数据类型 |
|----------|----------|----------|----------|
| `open_ended` | 无选项、无评分 | 自由文本对话 | `string` |
| `rating` | `X-Y 分`、`X 星` | 评分卡片 / 滑块 | `number` |
| `multiple_choice` | 括号内列出选项 | 选项卡片（单选）| `string` |
| `yes_no` | 是否 / 有没有 | 是否卡片 | `boolean` |
| NPS | `0-10 NPS` / 推荐意愿 | NPS 专用卡片 | `number` |
| 多选 | `可多选` + 选项列表 | 多选标签卡片 | `string[]` |

**核心原则：**
- 结构化问题（评分、选择）→ 交互卡片（快速、精确）
- 开放式问题 → 自由对话（深度、灵活）
- 两者在一次调研中混合使用，兼顾效率和深度

---

## 六、Notion 同步说明

调研完成后可自动同步到 Notion：

1. **配置**：`PUT /api/surveys/{id}/notion` — 指定 Notion 页面 ID
2. **同步**：`POST /api/surveys/{id}/notion/sync` — 手动触发
3. **自动同步**：开启 `autoSync` 后，每次对话完成自动写入

同步内容：
- Notion 数据库：每个提取字段一列，每个会话一行
- 页面内容：完整对话记录（引用块格式）

字段类型自动映射：
| 提取字段类型 | Notion 列类型 |
|-------------|--------------|
| `string` | Rich Text |
| `number` | Number |
| `boolean` | Checkbox |
| `string[]` | Multi Select |
| `object` | Rich Text (JSON) |

---

## 七、常见问题

**Q: 问卷必须用中文吗？**
A: 不需要。系统支持任意语言，LLM 会自动适配。只需确保 `settings.language` 与问卷语言一致。

**Q: 能否在问卷中混合使用中英文？**
A: 可以。LLM 会按主体语言生成 Agent 配置，对混合内容保持原样。

**Q: 追问规则需要我自己写吗？**
A: 不需要。Schema Agent 会根据问题内容和调研背景自动生成追问规则。但如果你在 `additionalContext` 中提供了具体关注点（如"重点追问 StreamSet 迁移原因"），生成的追问规则会更精准。

**Q: 交互卡片类型需要我指定吗？**
A: 不需要。Config Agent 会根据问题类型自动决定是否使用卡片及使用哪种。你只需在问卷中标注清楚评分范围和选项即可。

**Q: 一次调研最多多少个问题？**
A: 技术上没有硬限制，但建议不超过 20 个（含追问可能产生的 follow-up）。过长的调研会导致受访者疲劳，数据质量下降。

**Q: Notion 同步有列数限制吗？**
A: Notion 数据库最多 100 列。系统会自动校验，超出时跳过并发出警告。一般 15 题的问卷约产生 20-40 个提取字段，远在限制之内。
