# 深度访谈对话页面 — 视觉重构方案

> 设计关键词：**科技 · 可靠 · 温暖**
> 范围：`/s/[surveyId]` 对话页面全流程（Welcome → Chat → Completion）

---

## 一、现状诊断

### 当前问题

| 维度 | 问题 | 严重度 |
|------|------|--------|
| **品牌识别** | 通用蓝白配色，无差异化视觉语言，像任意聊天工具 | 🔴 高 |
| **情感传达** | 冷冰冰的功能界面，缺乏"温暖可靠的 AI 研究伙伴"感 | 🔴 高 |
| **动效系统** | 仅有 typing dots，无入场/过渡/反馈动画，体验割裂 | 🔴 高 |
| **视觉层次** | 消息气泡、卡片、输入框视觉权重接近，缺乏引导 | 🟡 中 |
| **欢迎页** | 扁平图标 + 文字堆叠，无记忆点，信任感建立不足 | 🟡 中 |
| **完成页** | 极简绿色勾，无仪式感，用户无法感知"我完成了一件有价值的事" | 🟡 中 |
| **交互卡片** | 功能正确但视觉粗糙，NPS/评分/滑块缺乏精致感 | 🟡 中 |
| **暗色模式** | 有基础支持，但未形成完整的暗色视觉体系 | 🟡 中 |
| **AI 形象** | 8x8 蓝色圆点，无个性，无法建立用户与"AI 研究员"的情感连接 | 🔴 高 |

### 保留的好设计
- ✅ Geist 字体系统（科技感强，保留）
- ✅ 响应式布局架构
- ✅ 安全区域适配
- ✅ 44px 触摸目标
- ✅ 轻量 markdown 解析器（无外部依赖，保留）
- ✅ SSE 流式架构（不动）
- ✅ 会话持久化逻辑（不动）

---

## 二、视觉语言定义

### 2.1 色彩系统

**设计理念**：深空蓝底色传达**科技**与**可靠**，琥珀暖光作为**温暖**点缀，大面积中性色保持呼吸感。

```
┌─────────────────────────────────────────────────────┐
│  Color Token           Light Mode      Dark Mode     │
├─────────────────────────────────────────────────────┤
│  --bg-primary          #FAFBFD          #0F1117       │  ← 主背景
│  --bg-surface          #FFFFFF          #181B25       │  ← 卡片/气泡表面
│  --bg-surface-raised   #F4F5F7          #1E2130       │  ← 用户气泡/输入框
│  --bg-overlay          #F8F9FB/80       #0F1117/80    │  ← 毛玻璃层
│                                                       │
│  --accent-primary      #3B5BDB          #6C8AFF       │  ← 主强调（科技蓝）
│  --accent-warm         #F59F00          #FFB84D       │  ← 暖光点缀（琥珀）
│  --accent-warm-soft    #FFF3D4          #3D2E10       │  ← 暖光背景
│  --accent-success      #2B8A3E          #51CF66       │  ← 成功/完成
│                                                       │
│  --text-primary        #1A1D26          #E8EAF0       │  ← 主文本
│  --text-secondary      #6B7280          #9CA3AF       │  ← 次要文本
│  --text-tertiary       #9CA3AF          #6B7280       │  ← 辅助文本
│                                                       │
│  --border-subtle       #E5E7EB          #2A2D3A       │  ← 细线分隔
│  --border-interactive  #3B5BDB/20       #6C8AFF/20    │  ← 交互元素边框
│                                                       │
│  --glow-warm           0 0 40px #F59F00/15            │  ← AI 头像光晕
│  --glow-blue           0 0 30px #3B5BDB/10            │  ← 交互卡片光晕
└─────────────────────────────────────────────────────┘
```

**渐变系统**：
- `--gradient-hero`: `linear-gradient(135deg, #3B5BDB 0%, #6C8AFF 50%, #F59F00 100%)` — 科技→温暖过渡
- `--gradient-surface`: `linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-primary) 100%)` — 纵深感
- `--gradient-warm-glow`: `radial-gradient(ellipse at center, #F59F00/8 0%, transparent 70%)` — AI 光晕

### 2.2 字体系统

```
┌─────────────────────────────────────────────────────┐
│  Token            Font       Weight    Size   Line   │
├─────────────────────────────────────────────────────┤
│  --type-display   Geist      600       28px   1.2    │  ← 欢迎页标题
│  --type-heading   Geist      600       20px   1.3    │  ← 区域标题
│  --type-body      Geist      400       15px   1.6    │  ← 对话正文
│  --type-body-sm   Geist      400       13px   1.5    │  ← 卡片标签
│  --type-caption   Geist      400       12px   1.4    │  ← 时间戳/辅助
│  --type-mono      Geist Mono 400       13px   1.5    │  ← 代码片段
└─────────────────────────────────────────────────────┘
```

对话正文选择 15px（而非 14px）提升可读性和温暖感。

### 2.3 圆角系统

```
--radius-xs:    6px    ← 标签/小按钮
--radius-sm:    10px   ← 消息气泡（内侧接缝角）
--radius-md:    14px   ← 消息气泡（外侧角）
--radius-lg:    20px   ← 卡片/对话框
--radius-xl:    28px   ← 输入框/大按钮
--radius-full:  9999px ← 头像/圆形按钮
```

消息气泡采用**不对称圆角**：外侧 14px，接缝侧 6px（模拟聊天软件的"尾巴"效果）。

### 2.4 阴影系统

```
--shadow-sm:      0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)
--shadow-md:      0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)
--shadow-lg:      0 8px 30px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)
--shadow-glow:    0 0 20px var(--accent-warm)/12, 0 0 40px var(--accent-warm)/6
--shadow-card:    0 2px 8px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.08)
```

暗色模式阴影切换为 `inset 0 1px 0 rgba(255,255,255,0.04)` 微光边缘替代投影。

### 2.5 间距系统

基础单位 4px，主要使用：4, 8, 12, 16, 20, 24, 32, 40, 48, 64

- 消息之间间距：**12px**（同角色连续）/ **20px**（角色切换）
- 卡片内边距：**20px**
- 输入区域内边距：**16px**
- 页面水平边距：**16px**（移动端）/ **24px**（桌面端）

---

## 三、AI Agent 形象系统

### 3.1 设计方向

AI 不再是一个蓝色圆点，而是一个**有温度的研究伙伴**。

**形象定位**：
- 不是拟人化的卡通人物（太不专业）
- 不是冰冷的机器人图标（太没温度）
- 而是一个**抽象化的光晕体** — 像一颗温暖的星辰，既有科技感又亲切

**头像设计**：
- 基础形态：圆形 + 微妙的内部渐变（蓝→琥珀）
- 待机状态：缓慢呼吸光晕（2.5s 周期）
- 思考状态：光晕加速脉冲 + 微粒子旋转
- 完成状态：扩散一次温暖光波

### 3.2 AI 资产生成提示词

> 以下内容输出至 `docs/asset-prompts.md`，供 Nano Banana 2 生成

---

## 四、组件重构设计

### 4.1 Welcome Screen（欢迎页）

**当前**：大蓝色圆点 + 标题 + 文字说明 + 按钮
**重构**：沉浸式入场体验

```
┌─────────────────────────────────────────────────┐
│                                                   │
│            ╭──────────────────────╮               │
│            │                      │               │
│            │    [AI Agent 头像]    │               │
│            │     呼吸光晕动画      │               │
│            │                      │               │
│            ╰──────────────────────╯               │
│                                                   │
│          ── 访谈标题（fade in）──                  │
│                                                   │
│         简短描述文字（stagger in）                 │
│                                                   │
│     ┌──────────┐┌──────────┐┌──────────┐         │
│     │  ⏱ 10min  ││  🔒 保密  ││  💬 自由  │         │
│     └──────────┘└──────────┘└──────────┘         │
│                                                   │
│         ┌─────────────────────────┐               │
│         │   ✨ 开始对话             │  ← 渐变按钮   │
│         └─────────────────────────┘               │
│                                                   │
│        随时可以跳过或停止  ← subtle caption        │
│                                                   │
└─────────────────────────────────────────────────┘
```

**动效设计**：
1. 页面加载 → 背景微光渐显（300ms）
2. AI 头像从 scale(0.8) + opacity(0) → scale(1) + opacity(1)（500ms spring）
3. 标题 fade-in（delay 200ms）
4. 描述 fade-in（delay 350ms）
5. 信任徽章 stagger-in，左→右各 delay 100ms（delay 500ms 起）
6. CTA 按钮 slide-up + fade-in（delay 700ms）
7. AI 头像进入**呼吸光晕**循环

**信任徽章**重构：
- 不再用 emoji，改用精致的线条图标（Lucide icons）
- 卡片化设计：浅色背景 + 细边框 + icon + 文字
- 暗色模式：毛玻璃效果 + 微光边缘

**CTA 按钮**：
- 主渐变：`--gradient-hero`
- Hover：微微 scale(1.02) + 光晕扩大
- Active：scale(0.98) + 快速回弹
- 始终带有微弱的 glow shadow

### 4.2 Chat Container（对话容器）

**当前**：白底 + 蓝色 header + 消息列表 + 输入框
**重构**：分层毛玻璃架构

```
┌─────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────┐     │
│  │ Header: AI 名字 + 在线状态 + 阶段指示    │     │  ← 毛玻璃 sticky
│  └─────────────────────────────────────────┘     │
│                                                   │
│     ← 微妙的纵向渐变背景                          │
│                                                   │
│  ○ [AI 头像]  ┌──────────────────────┐           │
│               │ AI 消息内容           │           │
│               │ 带 markdown 渲染     │           │
│               └──────────────────────┘           │
│                                                   │
│               ┌──────────────────────┐  [用户]   │
│               │ 用户消息             │           │
│               └──────────────────────┘           │
│                                                   │
│  ○ [AI 头像]  ┌──────────────────────┐           │
│               │ 正在思考中...         │           │
│               │ [typing animation]   │           │
│               └──────────────────────┘           │
│                                                   │
│  ┌─────────────────────────────────────────┐     │
│  │ [输入框 · placeholder]          [发送] │     │  ← 毛玻璃 sticky
│  └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

**Header 重构**：
- 毛玻璃背景：`backdrop-blur(16px)` + 半透明 bg
- 左侧：AI 头像（32px，带呼吸光晕）+ 问卷标题
- 右侧：进度指示（如 "探索中 3/8"，用 subtle 方式呈现）
- 底部：1px 渐变分隔线
- 进入时从上方 slide-down

**背景**：
- 不再是纯白/纯黑
- Light：极淡的蓝灰渐变（#FAFBFD → #F4F6FA）
- Dark：深空渐变（#0F1117 → #161924）
- 可选：极微弱的网格/点阵纹理（科技感）

**消息列表 scroll 增强**：
- 新消息入场：从 opacity(0) + translateY(12px) → 正常位置（300ms spring）
- Scroll-to-bottom：smooth behavior，新消息到达时自动
- 滚动时 header/footer 增加毛玻璃强度

### 4.3 Message Bubbles（消息气泡）

**AI 消息**：
```css
background: var(--bg-surface);
border: 1px solid var(--border-subtle);
border-radius: 6px 14px 14px 14px;  /* 左上接缝角小 */
box-shadow: var(--shadow-sm);
padding: 14px 18px;
max-width: 80%;
```
- 头像：32px 圆形，左侧 fixed，带呼吸光晕
- 连续 AI 消息：头像只显示第一条，后续消息缩进对齐
- Markdown 内容样式细化（更好的 blockquote、list 样式）

**用户消息**：
```css
background: var(--accent-primary);
color: white;
border-radius: 14px 14px 6px 14px;  /* 右下接缝角小 */
padding: 12px 18px;
max-width: 75%;
```
- 微妙的内阴影 `inset 0 -1px 0 rgba(0,0,0,0.1)` 增加质感
- 发送动效：从右侧 slide-in + fade + 微弹跳

**消息入场动画**：
- AI 消息：从左 slide-in（translateX(-8px) → 0，200ms）
- 用户消息：从右 slide-in（translateX(8px) → 0，150ms）
- 使用 CSS `@starting-style` 或 framer-motion `AnimatePresence`

### 4.4 Typing Indicator（思考动画）

**当前**：3 个跳动圆点 + 文字短语
**重构**：AI 思考状态的视觉化

**方案**：保留"趣味短语"概念，但视觉升级
- 3 个圆点 → 3 个渐变光球，大小不一（4px, 5px, 4px）
- 脉冲动画：不是简单 bounce，而是 glow + scale 联动
- 短语文字：改用 `--text-tertiary` 色，`--type-caption` 字号
- 短语切换：不是突然替换，而是 crossfade（旧的上滑消失 + 新的上滑进入）
- 整体容器有微弱的 `--glow-warm` 背景

### 4.5 Interactive Cards（交互卡片）

**整体卡片容器**重构：
```
┌─────────────────────────────────────────┐
│                                           │  ← 从 AI 气泡延伸出
│  ❓ 卡片问题文字                          │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │       [交互区域]                     │ │
│  └─────────────────────────────────────┘ │
│                                           │
└─────────────────────────────────────────┘
```

- 卡片从气泡底部"生长"出来，视觉上是气泡的延伸
- 入场动效：先显示 AI 文本 → 300ms 后卡片 expand-in（height 0 → auto + fade）
- 边框：`var(--border-interactive)` + 微弱 `--glow-blue`
- 提交后：优雅收起（高度缩减 + 内容变为单行确认）

**NPS Card 重构**：
- 0-10 改为胶囊按钮排列，不再是方块
- 颜色渐变保留但更柔和：淡红 → 淡黄 → 淡绿（背景色） + 深色文字
- 选中状态：scale(1.1) + ring + 底部弹出标签（如 "推荐"）
- 触觉反馈：选中时微震动（navigator.vibrate）

**Rating Card 重构**：
- 星星改为更现代的实心/空心切换
- Hover 时星星逐个 scale-up（stagger 50ms）
- 选中时：填充动画（从下向上填色 200ms）
- 添加半星支持的视觉暗示

**Slider Card 重构**：
- 轨道：渐变填充（左蓝→右透明）
- 滑块：更大的圆形 thumb（24px）+ shadow + active 时 ring 扩大
- 实时数值：跟随 thumb 的浮动标签
- 刻度标记：关键位置的小点

**MultiChoice/MultiSelect 重构**：
- 选项卡片化：每个选项是一个小卡片（非按钮）
- Hover：微升起（translateY(-1px) + shadow 加深）
- 选中：左侧出现 accent 色竖条 + 背景变为 accent-soft
- MultiSelect 的提交按钮：与 CTA 同款渐变

### 4.6 Message Input（输入框）

**重构**：
```
┌─────────────────────────────────────────────────┐
│  ┌─────────────────────────────────┐  ┌──────┐ │
│  │ 分享你的想法...                  │  │  →   │ │  ← 毛玻璃背景
│  └─────────────────────────────────┘  └──────┘ │
└─────────────────────────────────────────────────┘
```

- 外层容器：毛玻璃 + 细边框 + 微阴影
- 输入框：无边框，背景透明，focus 时外层边框变 accent
- 发送按钮：圆形 → 圆角方形（radius-sm），渐变背景
- 空输入时：发送按钮 muted（opacity 0.4），有内容时 accent + pulse 一次
- Focus 动效：border-color 从 subtle → accent（200ms transition）
- 发送动效：按钮 scale(0.9) → scale(1) 快速回弹

### 4.7 Completion Screen（完成页）

**当前**：绿色勾 + 两行文字
**重构**：仪式感十足的完成体验

```
┌─────────────────────────────────────────────────┐
│                                                   │
│                ✨ 光粒子散开动画 ✨                │
│                                                   │
│            ╭──────────────────────╮               │
│            │                      │               │
│            │   [AI 头像 · 完成态]  │               │
│            │    温暖光波扩散       │               │
│            │                      │               │
│            ╰──────────────────────╯               │
│                                                   │
│           ── 感谢你的分享 ──                       │
│                                                   │
│     你的每一句回答都将帮助我们做出                   │
│           更好的产品决策                            │
│                                                   │
│         ┌─────────────────────────┐               │
│         │  📊 访谈回顾             │  ← 可选       │
│         │  共 12 轮对话            │               │
│         │  覆盖 5 个主题           │               │
│         └─────────────────────────┘               │
│                                                   │
│          ┌──────────────────────┐                 │
│          │  开始新对话            │  ← 次要按钮     │
│          └──────────────────────┘                 │
│                                                   │
└─────────────────────────────────────────────────┘
```

**动效序列**（总时长 ~1.5s）：
1. 对话完成信号触发 → 背景微微变暖（色温提升）
2. AI 头像释放一圈温暖光波（500ms）
3. "感谢"文字 fade-up（delay 400ms）
4. 副文本 fade-up（delay 600ms）
5. 回顾卡片 expand-in（delay 800ms）
6. 按钮 fade-in（delay 1000ms）

### 4.8 进度指示系统（新增）

在 header 中集成一个**极其 subtle 的进度暗示**：

- **不是**传统进度条（访谈不应给用户压力）
- 而是一组微小的点（●●●○○○○○），与背景接近
- 或者：header 底部一条极细的渐变线，从左向右缓慢生长
- 颜色：`--accent-warm` 以低 opacity
- 目的：给用户潜意识的"前进感"，但不造成"还有多少"的焦虑

### 4.9 页面过渡（Phase Transitions）

**Welcome → Preparing**：
- 欢迎页整体 fade-out + scale(0.98)（300ms）
- 准备页 fade-in（200ms delay）
- AI 头像保持在原位，成为视觉锚点

**Preparing → Chat**：
- TypingIndicator 不是消失，而是"退回"到 header 中的头像位置
- 聊天界面从底部 slide-up
- 第一条 AI 消息自然入场

**Chat → Completion**：
- 最后一条消息发送完成后，短暂停顿（500ms）
- 输入框 slide-down 退场
- 完成卡片从输入框位置 expand-up

---

## 五、动效系统规范

### 5.1 动效库选择

**推荐：Framer Motion（`motion/react`）**

理由：
- React 19 原生支持（motion/react 新包名）
- `AnimatePresence` 完美处理消息列表增删
- `spring` 物理弹簧自然感强
- `layout` 动画处理卡片展开/收起
- 包体 ~30KB gzip，可接受
- 不需要 CSS-in-JS，与 Tailwind 完美兼容

### 5.2 动效 Token

```typescript
export const motionTokens = {
  // 弹簧参数
  spring: {
    gentle:  { type: "spring", stiffness: 120, damping: 20 },  // 气泡入场
    snappy:  { type: "spring", stiffness: 300, damping: 24 },  // 按钮反馈
    bounce:  { type: "spring", stiffness: 400, damping: 15 },  // 卡片选中
  },
  // 缓动
  ease: {
    default: [0.25, 0.1, 0.25, 1.0],    // 标准
    in:      [0.42, 0, 1, 1],            // 进入
    out:     [0, 0, 0.58, 1],            // 退出
    inOut:   [0.42, 0, 0.58, 1],         // 对称
  },
  // 时长
  duration: {
    instant:  0.1,   // 状态切换
    fast:     0.2,   // 微交互
    normal:   0.3,   // 标准动画
    slow:     0.5,   // 入场动画
    dramatic: 0.8,   // 完成庆祝
  },
  // Stagger
  stagger: {
    fast:    0.03,   // 列表项
    normal:  0.06,   // 卡片选项
    slow:    0.1,    // 欢迎页元素
  },
};
```

### 5.3 关键动效清单

| 触发场景 | 动效类型 | 参数 | 优先级 |
|---------|---------|------|--------|
| 新 AI 消息出现 | slideIn + fadeIn | x: -8→0, spring.gentle | P0 |
| 新用户消息出现 | slideIn + fadeIn | x: 8→0, spring.snappy | P0 |
| 交互卡片展开 | expandIn | height: 0→auto, spring.gentle | P0 |
| 卡片选项 hover | scale + shadow | scale: 1→1.02, duration.fast | P1 |
| 卡片选项选中 | scale + glow | scale: 1→1.05→1, spring.bounce | P0 |
| 卡片提交后收起 | shrink + fade | height→48px, opacity→0.7 | P1 |
| 发送按钮点击 | scale bounce | scale: 1→0.9→1, spring.snappy | P1 |
| 输入框 focus | border glow | border-color transition, 200ms | P1 |
| Typing indicator | glow pulse | opacity 0.4→1, 1.4s loop | P0 |
| 欢迎页入场 | stagger sequence | 见 4.1 详细描述 | P0 |
| 完成页入场 | celebration sequence | 见 4.7 详细描述 | P0 |
| 页面过渡 | crossfade | opacity + scale, 300ms | P1 |
| AI 头像呼吸 | glow pulse | box-shadow, 2.5s loop | P2 |
| 滚动到底 | smooth | scroll-behavior: smooth | P0 |
| 错误 banner | slideDown | y: -20→0, spring.gentle | P1 |

---

## 六、实施计划

### Phase 0：基础设施（预计 1-2h）

1. **安装 framer-motion**：`npm install motion`
2. **建立 Design Token 系统**：
   - 创建 `src/styles/tokens.css` — CSS 自定义属性
   - 创建 `src/lib/motion.ts` — 动效 token 导出
3. **更新 globals.css**：引入新色彩变量、字体规范
4. **准备 AI 头像资产**（你来生成，我来集成）

### Phase 1：核心对话体验（优先级最高）

**1a. Message Bubbles 重构**
- 文件：`message-list.tsx`
- 新色彩 + 不对称圆角 + 入场动画
- AI 头像升级（32px + 呼吸光晕）
- 连续消息的头像折叠逻辑

**1b. Chat Container 背景 + Header**
- 文件：`chat-container.tsx`
- 渐变背景 + 毛玻璃 header/footer
- 进度指示器（subtle）

**1c. Typing Indicator 升级**
- 文件：`typing-indicator.tsx`
- 渐变光球 + crossfade 文字
- 温暖光晕背景

**1d. Message Input 重构**
- 文件：`message-input.tsx`
- 毛玻璃容器 + focus 动效 + 发送按钮升级

### Phase 2：交互卡片系统

**2a. Card 容器统一**
- 文件：`interactive-card.tsx`
- 统一 CardWrapper 样式 + expand/collapse 动画
- 提交后 collapse 效果

**2b. NPS + Rating 重构**
- 胶囊按钮 + 渐变色 + 选中动画
- 星星填充动画

**2c. Choice + Slider 重构**
- 卡片化选项 + accent 竖条
- 渐变轨道 + 浮动标签

### Phase 3：页面流程

**3a. Welcome Screen 重构**
- 文件：`welcome-screen.tsx`
- 新布局 + 信任徽章卡片化 + 渐变 CTA
- 入场 stagger 动画序列

**3b. Completion Screen 重构**
- 文件：`completion-card.tsx`
- 仪式感动画序列 + 访谈回顾卡片
- 温暖光波效果

**3c. Phase Transitions**
- 文件：`page.tsx`（survey page）
- Welcome → Preparing → Chat → Completion 过渡动画

### Phase 4：抛光

- 暗色模式全面优化
- 微交互细节（hover 状态、focus ring、scroll 反馈）
- 性能优化（`will-change`、`transform3d` 硬件加速）
- 可及性检查（减少动画偏好 `prefers-reduced-motion` 支持）

---

## 七、技术注意事项

### 不破坏的原则
- **不改变任何 API 接口**：SSE 格式、session 管理、工具调用全部不动
- **不改变 hook 逻辑**：`use-chat.ts` 的状态管理、nudge 机制保持原样
- **不改变 markdown 解析器**：`simple-markdown.tsx` 仅样式调整
- **不改变 page.tsx 的状态机**：4 个 phase 的切换逻辑不变，仅包裹动画

### 性能预算
- Framer Motion (gzip): ~30KB — 可接受
- 动画帧率目标：60fps
- `AnimatePresence` 仅包裹可变列表，不包裹整个页面
- 使用 CSS `will-change` 提示合成层
- `prefers-reduced-motion: reduce` 时降级为 opacity-only 过渡

### 渐进增强
- 所有动效降级方案：无动画时 UI 依然完整可用
- 低端设备自动降级：检测 `navigator.hardwareConcurrency < 4` 时简化动画
- 首屏加载：关键样式内联，动效库异步加载

---

## 八、文件变更清单

```
新增文件：
  src/styles/tokens.css            — CSS 自定义属性（色彩/圆角/阴影/间距）
  src/lib/motion.ts                — Framer Motion token 配置
  public/images/agent-avatar.png   — AI Agent 头像（你生成）
  public/images/agent-avatar-dark.png  — 暗色版本（可选）
  docs/asset-prompts.md            — AI 资产生成提示词

修改文件：
  src/app/globals.css              — 引入 tokens.css + 全局样式更新
  src/components/chat/chat-container.tsx    — 背景/header/layout 重构
  src/components/chat/message-list.tsx      — 气泡样式/动画/头像
  src/components/chat/message-input.tsx     — 毛玻璃/focus 动效
  src/components/chat/typing-indicator.tsx  — 光球/crossfade
  src/components/chat/interactive-card.tsx  — 全部 7 种卡片重构
  src/components/chat/welcome-screen.tsx    — 沉浸式入场
  src/components/chat/completion-card.tsx   — 仪式感完成页
  src/app/s/[surveyId]/page.tsx            — Phase transition 动画

不变文件：
  src/components/chat/simple-markdown.tsx   — 仅微调样式 class
  src/hooks/use-chat.ts                    — 不变
  src/lib/conversation/*                   — 不变
  src/app/api/*                            — 不变
```
