# AgentDrivenSurvey Prompt 系统性审查报告

> 审查日期：2026-03-24
> 审查依据：「Agent 长指令场景下提高 LLM 指令遵循度：业界最佳实践」（Notion Document Hub）
> 来源论文：Stanford/MIT TACL 2024, 清华 AgentIF NeurIPS 2025, Apple ICLR 2025, Anthropic Context Engineering 2025, DECRIM 2025

---

## 一、审查框架（7 条黄金法则）

| # | 法则 | 来源 | 要点 |
|---|------|------|------|
| G1 | **System prompt 尽可能精简** | Anthropic/行业经验 | 800-2000 tokens 最优，3000+ 推理衰减 |
| G2 | **关键规则首尾锚定** | Lost in the Middle (TACL 2024) | U 型注意力曲线，中间段显著衰减 |
| G3 | **口诀化 > 散文化** | Apple ICLR 2025 | 措辞方式比任务难度更影响 embedding 编码强度 |
| G4 | **一个示例 > 100 字描述** | Anthropic/OpenAI | Few-shot 示例覆盖正常路径和边界 |
| G5 | **从失败中生长** | 运营层实践 | 先精简上线 → 观察失败 → 针对性补规则 |
| G6 | **显式检查点 >> 隐含期望** | DECRIM 2025 | 检查点将条件约束遵循率提升 15-25% |
| G7 | **正面指令 > 负面禁止** | OpenAI Best Practices | "用列表" > "不要用表格" |

补充认知：
- **约束边际衰减**（AgentIF）：707 条真实指令，平均 11.9 条约束，最佳模型 CSR 仅 59.8%。工具调用规范和条件约束是最易违反类型。
- **分层优先级**：铁律（违反=致命）> 强约束（违反=需修正）> 建议（违反=可接受）

---

## 二、当前架构评估

### 组装顺序（prompt-builder.ts）
```
guardrails → soul → themes → strategy → context → language → tools → overrides → start
```

**9 个 section**，用 `\n\n---\n\n` 分隔。

### Token 估算（典型 12 轮问卷）
| 模块 | 估算 tokens | 占比 |
|------|------------|------|
| guardrails | ~600 | 10% |
| soul | ~250 | 4% |
| themes | ~400（取决于问卷） | 7% |
| **strategy** | **~1,400** | **23%** |
| context | ~300（动态） | 5% |
| language | ~120 | 2% |
| tools | ~80 | 1% |
| overrides | ~100 | 2% |
| start | ~150 | 3% |
| **Total** | **~3,400** | — |

✅ **总量在 8K 阈值以内**，P6 通过。

---

## 三、逐模块诊断

### 3.1 guardrails.ts — 安全边界 ✅ 良好

**优点**：
- 放在首位（P5 首位效应 ✅）
- 规则明确、无歧义
- 分层升级策略（off-topic 1/2/3 次渐进处理）

**问题**：
- [ ] **G1** 表格格式在 system prompt 中可能被 tokenizer 拆散，改为编号列表更安全

### 3.2 soul.ts — Agent 人格 ✅ 良好

**优点**：
- 极简精炼（~250 tokens），全是有效信息
- "Coffee shop" 隐喻给 AI 一个明确的角色锚点
- 反例清单（"You are absolutely NOT"）很有效

**问题**：
- [ ] **S1** `${product}` 出现在 soul 里使它与 themes 产生耦合——soul 应该是纯人格层，product 上下文应在 themes 注入。但这是小问题，不影响遵循率。

### 3.3 themes.ts — 探索方向 ✅ 良好

**优点**：
- 明确说"map in your head, not a checklist"——直接对抗逐题轮询倾向
- 给了时间预算（targetRounds）

**问题**：
- [ ] **T1** "Aim to complete in approximately X rounds" 是个软性建议，AI 可能忽略。可改为更强的约束："`You MUST start closing when roundCount >= targetRounds - 2`"，但这已经在 context.ts 的 stage 逻辑里处理了，所以问题不大。

### 3.4 strategy.ts — 访谈策略 ⚠️ 需要重构

**最大模块（~1,400 tokens），问题最集中。**

#### 问题清单（按严重度排序）：

**[严重] ST1 — 约束过载 → 工具调用规范最易违反**
- strategy 包含 **11 个子章节**，远超行业经验的安全阈值
- AgentIF 研究明确指出：**工具调用规范和条件约束是最易违反类型**——而 card 使用规则恰好就是工具调用规范
- 实测验证：card 触发规则在 baseline 测试中 **仅 1/6 轮遵循**
- 违反法则：G1（精简）

**[严重] ST2 — 高频规则落入注意力低谷**
- strategy 被放在第 4 位（guardrails → soul → themes → **strategy**）
- 每轮必须遵循的格式规则（≤4 句、单问题、共情开头）落在 U 型注意力曲线中间
- 实测验证：长度限制在 baseline 测试中 **5/6 通过但 Round 4（用户给出精彩痛点时）违规**——恰好是最需要自制力的时刻
- 违反法则：G2（首尾锚定）

**[中等] ST3 — 散文过多，口诀化不足**
- "Comfortable Pauses" 整段可压缩为：`Heavy emotion → pause + acknowledge, don't rush`
- "Reflective Confirmation" 整段可压缩为：`Key insight → restate in 1 sentence, wait for confirm`
- 违反法则：G3（口诀化 > 散文化）

**[中等] ST4 — 示例与规则混杂**
- 3 个好示例散布在 "Be Proactive" 段落中间，被规则描述打断
- 最佳实践是规则在前、示例紧跟（G4）

**[中等] ST5 — 重复/冗余**
- "2-4 sentences" 出现 2 次（Examples 注释 + Each Message）
- Card usage + Card trigger 内容高度重叠
- "toss the ball back" 和 "last sentence must be a question" 是同一条规则
- 违反法则：G1（精简）

**[低] ST6 — 职责混杂**
- Opening interaction 和 Card usage 是行为层面的（WHAT），不是策略层面的（HOW）
- 可迁出为独立模块，但不影响遵循率

**[低] ST7 — 缺少显式检查点**
- 没有 self-check 机制（"发送前检查：≤4 句？只有 1 个问题？以问题结尾？"）
- DECRIM 研究显示检查点可将条件约束遵循率提升 15-25%
- 违反法则：G6（显式检查点）

#### Autoresearch 实测数据：
| 规则 | Baseline 遵循率 | 失败场景 |
|------|----------------|---------|
| 长度 ≤4 句 | 5/6 (83%) | 用户给出精彩痛点时超标 |
| Card 主动使用 | 1/6 (17%) | 几乎全部未触发（未注册 tools 时 0/6） |
| 共情开头 | 5/6 (83%) | 模糊回答时偶尔用"Fair enough"敷衍 |
| 深挖不跳题 | 6/6 (100%) | — |
| 单问题 | 4/6 (67%) | Opening 阶段复合问题 |

### 3.5 context.ts — 动态上下文 ✅ 良好

**优点**：
- 每轮动态生成，信息精准
- Stage guidance 清晰（opening/exploring/closing）
- Closing sequence 步骤明确

**问题**：
- [ ] **C1** Closing sequence 有 5 步且步骤复杂（NPS → 建议 → 总结确认 → 感谢+评分 → conclude），可能导致 AI 在 closing 阶段"迷路"。建议给每步加编号标记，并在每轮注入"上次完成到第几步"。

### 3.6 prompt-builder.ts — 组装器

**问题**：
- [ ] **PB1 — 组装顺序不符合 P5**：当前顺序 `guardrails → soul → themes → strategy → context`。根据 U 型注意力，strategy 的核心规则（每条消息的格式要求）应该更靠前或靠后。建议：将 strategy 的"Each Message"规则提取到 guardrails 之后作为 "## Response Format" 独立 section。
- [ ] **PB2 — language/tools/start 放在最后是对的**（近因效应），但 start（Getting Started）只在第一轮有用，后续轮次浪费 tokens。可改为仅在 `roundCount === 0` 时注入。

---

## 四、优化方案

### Phase 1：结构性修复（高收益，立即可做）

| ID | 改动 | 法则依据 | 预期效果 |
|----|------|---------|---------|
| **R1** | 从 strategy 提取"Each Message"规则 → 独立 `## Response Format` section，放在 soul 之后（首位效应） | G2 首尾锚定 | 长度/单问题遵循率 +20-30% |
| **R2** | strategy 11 节 → 6 节：合并 Depth+Funnel、Card Usage+Trigger、Pacing+Topic | G1 精简 | 约束数降到安全区间 |
| **R3** | Comfortable Pauses / Reflective Confirmation → 各一句口诀 | G3 口诀化 | -100 tokens |
| **R4** | 新增 Response Checkpoint（发送前自检：≤4句？1个问题？以问题结尾？共情开头？） | G6 显式检查点 | 条件约束遵循率 +15-25% |
| **R5** | startBlock 仅 roundCount === 0 时注入 | G1 精简 | 后续轮次 -150 tokens |

### Phase 2：内容优化（中等收益，需验证）

| ID | 改动 | 法则依据 | 预期效果 |
|----|------|---------|---------|
| **R6** | guardrails 表格 → 编号列表 | G7 正面指令 | tokenization 更稳定 |
| **R7** | 示例集中：规则在前、示例紧跟，不交叉 | G4 示例锚定 | 示例效力提升 |
| **R8** | Closing sequence 加步骤追踪（"You've done steps 1-2, now do step 3"） | G6 检查点 | Closing 完整度 +15% |
| **R9** | 尾部追加 "## Quick Rules Recap"（近因效应锚点） | G2 首尾锚定 | 整体遵循率 +10% |

### Phase 3：架构级（需更多测试）

| ID | 改动 | 法则依据 | 预期效果 |
|----|------|---------|---------|
| **R10** | Card/Opening 迁出为 `behaviors.ts` | 架构分层 | 职责分离 |
| **R11** | 动态 token 预算：按 stage 渐进加载 | G1 精简 | 每轮 system prompt 更精准 |
| **R12** | DECRIM 自纠正：engine.ts 层面加 "before sending, verify format rules" 的 tool | G6 检查点 | 引擎级保障 |

---

## 五、建议的 Autoresearch 基线

**在应用 Phase 1（R1-R5）改动之后**，当前 prompt 才适合作为 autoresearch 的基线。原因：

1. **autoresearch 只能优化措辞，不能重排架构**——当前 60% baseline 主要是结构问题（注意力低谷、约束过载），不是措辞问题
2. Phase 1 修复结构 + 加检查点后，预估 baseline 从 60% → 80%+
3. 然后 autoresearch 在更高基线上做措辞微调，目标 90%+
4. **检查点机制（R4）是最关键的改动**——DECRIM 研究的 15-25% 提升直接作用于条件约束，而长度/card 规则恰好就是条件约束

---

## 六、总结

| 维度 | 当前状态 | 主要问题 |
|------|---------|---------|
| 整体架构 | ✅ 模块化良好 | 组装顺序未利用注意力曲线 |
| Token 预算 | ✅ ~3,400 tokens | startBlock 可按需加载 |
| guardrails | ✅ 良好 | 表格格式小问题 |
| soul | ✅ 精炼 | 无重大问题 |
| themes | ✅ 良好 | 无重大问题 |
| **strategy** | ⚠️ **需重构** | 过载(11节)、Lost in Middle、散文过多、职责混杂 |
| context | ✅ 良好 | Closing 追踪可改进 |
| builder | ⚠️ 需调整 | 顺序+按需加载 |

**结论：先做 Phase 1 结构优化（R1-R4），再跑 autoresearch。**
