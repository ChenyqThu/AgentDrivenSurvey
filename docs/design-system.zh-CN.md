# Agent Driven Survey — 前端设计系统

[English](./design-system.md) · [返回架构文档](./architecture.zh-CN.md) · [README](../README.zh-CN.md)

本项目视觉语言、动效系统、组件库、以及 AI agent 协作流程的权威参考。新增 UI、挑选颜色、写动画之前先读这里。**系统是有主张的，默认值是承重的，偏离要有理由。**

---

## 1. 设计哲学

### 1.1 核心论点

> **AI 生不出好 UI，不是因为它没能力，而是因为没人把正确的词汇喂给它。**

这和产品本身"深度优于广度"的理念同构。迷惑时按序适用以下五条原则：

1. **深度优于广度**：少做三件做到极致；抵抗每个角落都要装饰的冲动。
2. **温暖科技**：每一个技术信号（渐变、阴影、密排网格）搭配一个人味信号（暖色 accent、微文案、呼吸光晕）。纯冷技术显得企业化，纯温暖显得玩具化，永远两者兼有。
3. **像人说话**：微文案要有人味——具体、略带温度、拒绝模板。"出错了"就是失败。
4. **尊重时刻**：动画时长要匹配分量——微交互 100–150ms、常规 UI 200–300ms、>300ms 只留给被"挣到"的高光时刻（如访谈完成）。UI 机械动作不得使用 bounce easing，留给庆祝。
5. **Token 驱动，系统性**：所有颜色/间距/圆角/阴影/字体都走 CSS custom properties。硬编码 Tailwind（`bg-gray-900`、`text-blue-600`）视为 bug。

以上原则固化在根目录 [`.impeccable.md`](../.impeccable.md)，由 Impeccable 命令自动加载。

### 1.2 品牌人格

三个词，定义于 [`src/app/globals.css`](../src/app/globals.css)：

| 词 | 含义 | 表达 |
|---|---|---|
| **科技** | 现代、精确、克制 | Geist 字体、紧字距、软阴影优于硬边框 |
| **可靠** | 一致、可预测 | 提交按钮不用弹簧、慷慨的触控区 |
| **温暖** | 平衡技术感 | 橙色暖 accent、头像呼吸光晕、人味微文案 |

**语气**：对话但不随意——像一个拿着笔记本的聪明朋友。**情绪弧**：信任 → 好奇 → 被倾听 → 闭合。

### 1.3 Register 映射（brand / product 分区）

Impeccable 区分 **brand**（表达性）与 **product**（功能性）。本项目两者都有：

| 表面 | Register | 理由 |
|---|---|---|
| `/s/[surveyId]` 欢迎 + 聊天 + 完成 | **brand** | 第一印象、情绪弧、一次性高权重 |
| `src/components/chat/*` | **brand** | 受访者体验的一部分 |
| `/admin/*` | **product** | 给专业用户的任务界面 |
| `src/components/ui/*` | **product** 原语 | 被上两层组合使用 |

Impeccable 命令（`/polish`、`/animate`、`/critique`、`/bolder`、`/quieter`）会根据目标路径自动调整词汇。

---

## 2. AI Agent 协作流程

系统显式把 coding agent 当作一等设计协作者，把设计词汇灌进每一条 prompt。

### 2.1 消费的 skills

| Skill | 作用 |
|---|---|
| [`pbakaus/impeccable`](https://github.com/pbakaus/impeccable) | 设计词汇层——20 条斜杠命令（`/audit`、`/polish`、`/critique`、`/animate`、`/arrange`、`/typeset`、`/colorize`、`/bolder`、`/quieter`、`/delight`、`/distill`、`/harden`、`/normalize`、`/extract`、`/clarify`、`/adapt`、`/onboard`、`/simplify`、`/overdrive`、`/teach-impeccable`） |
| [`emil-design-eng`](https://agnxi.com/emilkowalski/skills/emil-design-eng) | Emil Kowalski 的"品味"封装——动画时长、缓动规则、微交互打磨 |
| [`pixel-point/animate-text`](https://pixelpoint.io/skills/animate-text/) | 24 个精选文字动画规格（JSON 契约）——英雄标题展开、word crossfade、typewriter 等 |
| [`anthropic-skills:frontend-design`](https://github.com/anthropics/skills) | Anthropic 上游基础 skill——Impeccable 叠加其上 |

用 `npx skills add <pkg>` 安装。Skill 锁文件提交为 [`skills-lock.json`](../skills-lock.json)；安装产物落在 `.agents/`（gitignored，可由锁文件复现）。

### 2.2 项目级设计上下文

根目录 `.impeccable.md` 捕获了调校这些通用 skill 的项目专属旋钮：

- 用户（受访者 + 管理员）及其情感需求
- 品牌人格 + 语气 + 情绪弧
- 参考与反参考
- 主题开关（light + dark，两种都必须发）
- 无障碍基线（WCAG AA、减动效、44px 触控）
- 值得先知道的现有复用资产

品牌定位变了就重跑 `/teach-impeccable`。

### 2.3 何时用哪条命令

| 目标 | 命令 | 典型范围 |
|---|---|---|
| 把未打磨代码拉到系统标准 | `/normalize <path>` | Admin 页、新组件 |
| 加弹簧驱动的微交互 | `/animate <path>` | 任何有状态切换的 UI |
| 获取结构化 UX 审计 | `/critique <path>` | 发布前每个 feature |
| 全面技术质量扫查 | `/audit <path>` | 大版本发布前 |
| 最后微细节打磨 | `/polish <path>` | 其他都做完之后 |
| 处理边界态/i18n/文本溢出 | `/harden <path>` | 上生产前 |
| 加庆祝/难忘的瞬间 | `/delight <path>` | 高价值里程碑 |

---

## 3. Design Tokens

全部 tokens 在 [`src/app/globals.css`](../src/app/globals.css)，以 CSS custom properties 定义于 `:root`，暗色模式通过 `prefers-color-scheme: dark` 覆盖。**永不内联 hex 颜色**——没有对应 token 就先加 token。

### 3.1 颜色

| Token | 浅色 | 暗色 | 用途 |
|---|---|---|---|
| `--bg-primary` | `#FAFBFD` | `#0F1117` | 页面背景 |
| `--bg-surface` | `#FFFFFF` | `#181B25` | 卡片、面板 |
| `--bg-surface-raised` | `#F4F5F7` | `#1E2130` | 悬停、skeleton、代码块 |
| `--bg-overlay` | 半透明 | 半透明 | 玻璃感 header（配 `.glass`） |
| `--bg-chat` | 渐变 | 渐变 | 聊天区背景 |
| `--accent-primary` | `#3B5BDB` | `#6C8AFF` | 主操作、focus ring |
| `--accent-primary-soft` | 8% 着色 | 12% 着色 | 选中背景 |
| `--accent-warm` | `#F59F00` | `#FFB84D` | 暖意、头像光晕、"暂停"类 |
| `--accent-success` | `#2B8A3E` | `#51CF66` | 发布、active |
| `--accent-danger` | `#E03131` | `#FF6B6B` | 破坏性动作、错误 |
| `--text-primary` | `#1A1D26` | `#E8EAF0` | 标题、正文 |
| `--text-secondary` | `#6B7280` | `#9CA3AF` | 说明 |
| `--text-tertiary` | `#9CA3AF` | `#6B7280` | 提示、标注 |
| `--border-subtle` | `#E5E7EB` | `#2A2D3A` | 分割线、卡片边 |
| `--border-interactive` | 20% 主色 | 20% 主色 | focus、选中 |

### 3.2 间距 & 圆角

| Token | 值 | 用途 |
|---|---|---|
| `--radius-xs` | 6px | 输入、小按钮 |
| `--radius-sm` | 10px | 标准按钮、表单字段 |
| `--radius-md` | 14px | 卡片 |
| `--radius-lg` | 20px | 模态、特色面板 |
| `--radius-xl` | 28px | 胶囊按钮、hero CTA |
| `--radius-full` | 9999px | 头像、徽章、小圆点 |

间距沿用 Tailwind 4px 网格。某个值在 3+ 处复用才值得加 token。

### 3.3 阴影 & 光晕

| Token | 作用 |
|---|---|
| `--shadow-sm` | 轻度升起（sticky header、表单） |
| `--shadow-md` | 按钮、hover-raised 卡片 |
| `--shadow-lg` | 模态、特色面板 |
| `--shadow-card` | 默认卡片（比 `shadow-sm` 更软） |
| `--shadow-glow-warm` | 暖色光晕（welcome CTA、完成页头像） |
| `--shadow-glow-blue` | 主色光晕（slider thumb active、focus） |

### 3.4 字体

字体：**Geist Sans** + **Geist Mono** via `next/font/google`。字号 token 化：

| Token | 值 | 用途 |
|---|---|---|
| `--type-display-size` / `-weight` / `-line` / `-tracking` | 32px / 700 / 1.15 / -0.02em | `<h1>` hero 标题 |
| `--type-title-size` / `-weight` / `-line` | 20px / 600 / 1.3 | section 标题 |
| `--type-body-size` / `-line` | 14px / 1.5 | 正文 |
| `--type-caption-size` / `-line` / `-tracking` | 12px / 1.4 / 0.01em | 提示、标注 |
| `--type-heading-1` / `-2` / `-3` | 16 / 15 / 14px | Markdown 渲染的标题 |

### 3.5 渐变

| Token | 作用 |
|---|---|
| `--gradient-hero` | 品牌主渐变——`#3B5BDB → #6C8AFF → #F59F00`（线性 135°）。每个视图只用于单个最重要的 CTA |
| `--gradient-warm-glow` | 柔和暖意径向，用于头像光环、庆祝背景 |
| `--gradient-nps-low` / `-mid` / `-high` | NPS 分段着色（暗色模式提升到 28% 保证对比度） |
| `--gradient-shimmer` | `.skeleton` 占位符横扫 |

---

## 4. 动效系统

动效 tokens 在 [`src/lib/motion.ts`](../src/lib/motion.ts)。**优先复用已有 variant，不要随便发明新的。**

### 4.1 弹簧

```ts
springs.gentle  // { stiffness: 120, damping: 20 }  — 消息入场、卡片展开
springs.snappy  // { stiffness: 300, damping: 24 }  — 按钮反馈、chevron
springs.bounce  // { stiffness: 400, damping: 15 }  — checkmark 弹跳、confetti 触发（仅庆祝）
```

### 4.2 时长

```ts
durations.instant  = 0.1s   // 微交互（hover、focus）
durations.fast     = 0.2s   // 标准 UI 过渡
durations.normal   = 0.3s   // 卡片展开、页面级
durations.slow     = 0.5s   // 多元素 stagger
durations.dramatic = 0.8s   // 被挣到的里程碑（完成页光晕）
```

Emil 规则：超 300ms 且非庆祝，请给理由。

### 4.3 Variants

| Variant | 用途 |
|---|---|
| `fadeUpVariants` | 通用入场（opacity + y:16→0） |
| `fadeInVariants` | 仅淡入 |
| `messageAIVariants` | AI 消息气泡（从左入，springs 200/20） |
| `messageUserVariants` | 用户气泡（从右入，springs 260/22） |
| `cardExpandVariants` | 交互卡片入场（opacity + y + scale，子项 stagger） |
| `staggerContainer(delay)` | stagger 子项容器 |
| `slideDownVariants` | Header / banner 入场 |
| `welcomeSequence` | 欢迎屏容器 + item |
| `completionSequence` | 完成卡片容器 + glow + text |
| `scaleTap` | `{ whileTap: { scale: 0.95 }, transition: springs.snappy }` |
| `scaleHover` | `{ whileHover: { scale: 1.02, y: -1 }, transition: springs.gentle }` |

### 4.4 减动效

`globals.css` 全局尊重 `prefers-reduced-motion: reduce`——所有 CSS 动画/过渡钳到 0.01ms。新增 Framer Motion variant 时，验证退化是否可读（通常框架自动处理，但请测试）。

---

## 5. 组件库

位于 [`src/components/ui/`](../src/components/ui/)。全部 token 驱动、light/dark 双模就绪。

### 5.1 Button — [`button.tsx`](../src/components/ui/button.tsx) + [`button-styles.ts`](../src/components/ui/button-styles.ts)

7 variant × 3 size，内建 loading、icon、motion：

```tsx
<Button variant="primary" size="md" loading={isSubmitting}>
  Publish Survey
</Button>
```

| Variant | 何时用 |
|---|---|
| `primary` | Hero 渐变——每视图唯一最重要 CTA |
| `secondary` | 实色主色——标准 CTA（Copy、Submit） |
| `outline` | 带边——三级动作（Export CSV、View Responses） |
| `ghost` | 仅文字——安静动作（Cancel、View） |
| `success` | Publish、Resume |
| `warm` | Pause、降级动作 |
| `danger` | 破坏性（Delete、永久关闭） |

**客户端/服务端分层**：`Button` 是 client component（用 Framer Motion）。若 server component 要渲染同款视觉（如 `<Link>`），从 `button-styles.ts` 导入 `buttonClassName`：

```tsx
// server component
import { buttonClassName } from "@/components/ui/button-styles";

<Link href="/admin/surveys/new" className={buttonClassName("primary", "md")}>
  + New Survey
</Link>
```

### 5.2 StatusBadge — [`status-badge.tsx`](../src/components/ui/status-badge.tsx)

把业务 status 字符串映射到设计色调。支持问卷态（`draft / active / paused / closed`）和会话态（`active / completed / abandoned`）：

```tsx
<StatusBadge status={survey.status} size="sm" />
<StatusBadge status="custom" tone="warning" label="Needs Review" />
```

### 5.3 Skeleton — [`skeleton.tsx`](../src/components/ui/skeleton.tsx)

原语 + 预制。纯 CSS shimmer，尊重减动效：

```tsx
<Skeleton className="h-4 w-32" />           // 原语
<SkeletonText lines={3} />                   // 段落
<SkeletonCard />                             // stat 卡片形状
<SkeletonRow columns={5} />                  // 表格行
```

**异步数据阻塞 UI 时一律用 Skeleton，不要显示"Loading…"字符串。**

### 5.4 AnimatedText — [`animated-text.tsx`](../src/components/ui/animated-text.tsx)

翻译自 `pixel-point/animate-text` 的 spec JSON。**只用于 hero 和庆祝时刻，不要每个标题都用。**

| 组件 | Spec | 参数 | 使用场景 |
|---|---|---|---|
| `SoftBlurIn` | `soft-blur-in`（per-character，超 40ch 自动转 per-word） | 900ms、25ms stagger、y 16→0、blur 12→0、`cubic-bezier(0.22, 1, 0.36, 1)` | 欢迎页 hero 标题 |
| `PerWordCrossfade` | `per-word-crossfade` | 700ms、70ms stagger、y 8→0、`cubic-bezier(0.16, 1, 0.3, 1)` | section 标题、完成时刻 |
| `CountUp` | —（自定义，用 `useSpring` + `useInView`） | stiffness 90、damping 22、mass 0.9、once | Dashboard 数字 |

```tsx
<SoftBlurIn as="h1" text={survey.title} delay={0.1} className="text-[var(--type-display-size)]" />
<PerWordCrossfade as="p" text="Interview Complete" />
<CountUp value={42} className="text-[32px]" />
```

**避免**：叠在 SSE 流式文字上（双重效果）；按钮文案（破坏 affordance）。

### 5.5 Dashboard view — [`src/components/admin/dashboard-view.tsx`](../src/components/admin/dashboard-view.tsx)

嵌入 admin dashboard server component 的 client 包装。承担：
- stat 卡片 stagger 入场（含 `CountUp`）
- 问卷列表行 stagger 入场
- Hover lift
- 空态带插画

当 server page 需要客户端动效但不想把整页转成 `"use client"` 时，这个模式值得复制。

---

## 6. 无障碍

基线（Code Review 强制）：

- **WCAG AA** 对比度。Token 调色板已审计，**偏离 token 就得自己负责再审计**。
- **减动效**——`prefers-reduced-motion: reduce` 全局尊重。`.avatar-breathe` 和 `.skeleton--animated` 显式 opt out。
- **触控区**——移动端 44px 最小。NPS / 卡片按钮强制 `min-h-[44px]`。
- **Focus ring**——所有可交互元素走 `focus-visible:ring-[var(--accent-primary)]`。禁止 `outline: none` 不给替代。
- **读屏器**——聊天消息列表 `role="log"`；实时计数器（如多选的"已选 N"）用 `aria-live="polite"`。交互卡片暴露 `aria-label`。

---

## 7. 扩展系统

### 7.1 加 token

1. `:root` 加 light 值（[`globals.css`](../src/app/globals.css)）。
2. 在 `@media (prefers-color-scheme: dark)` 块里镜像。
3. 本文 §3 记录。

### 7.2 加动效 variant

1. **先在 [`motion.ts`](../src/lib/motion.ts) 找有没有现成的**。
2. 确实要新增，加一行 JSDoc 说明何时用。
3. 本文 §4.3 记录。

### 7.3 加组件

1. 复用性检查：2+ 个表面用到才进 `ui/`，否则放本地。
2. 确定 client/server：用 motion/hooks/交互就 `"use client"`；否则保持 server（更快、更小包）。
3. 仅 token 样式（禁硬编码色）。
4. 本文 §5 记录。

### 7.4 发布前检查表

任何影响 UI 的 PR 合并前：

```bash
# 1. 类型 + lint
npx tsc --noEmit
npx eslint .

# 2. 硬编码色扫查（src/app + src/components 里必须 0 命中）
rg "bg-(gray|blue|yellow|red|green|orange|purple|pink|indigo|emerald|amber|rose)-\d+" src/app src/components src/hooks

# 3. 生产构建
npm run build

# 4. Skill 驱动的质量扫查（按改动类型挑一个）
/polish <changed-path>     # 最后微细节
/critique <changed-path>   # UX 审计
/audit <changed-path>      # 技术质量
```

手工视觉 QA：light + dark、移动（390×844）+ 桌面（1440×900）、`prefers-reduced-motion: reduce` 开启。

---

## 8. 参考

- [`.impeccable.md`](../.impeccable.md) — 项目设计上下文（Impeccable 自动加载）
- [Emil Kowalski — Agents with Taste](https://emilkowal.ski/ui/agents-with-taste) — skill 背后的方法论
- [Impeccable 设计系统](https://impeccable.style) — 词汇层
- [pixel-point/animate-text](https://pixelpoint.io/skills/animate-text/) — 文字动画规格
- [架构文档](./architecture.zh-CN.md) — 设计系统在大系统中的位置

_最后更新: 2026-04-24._
