# AI 资产生成提示词

> 用于 Nano Banana 2 或其他图像生成模型
> 所有资产均需提供 Light / Dark 两个版本

---

## 1. AI Agent 头像（核心资产）

### 1a. 主头像 — Light Mode

**尺寸**：512 × 512px（导出时裁剪为 128×128 / 64×64 / 32×32 三种）
**比例**：1:1 正方形，主体居中，四周留 15% 安全边距
**格式**：PNG，透明背景

**提示词**：
```
A minimal abstract glowing orb icon on transparent background. The orb is a soft sphere with an inner gradient transitioning from deep sapphire blue (#3B5BDB) on the left to warm amber (#F59F00) on the right. The surface has a subtle glass-like refraction effect with a gentle specular highlight at the top-left. Surrounded by a soft diffused glow halo in warm amber tones, giving a feeling of warmth and intelligence. The overall style is clean, modern, tech-forward yet approachable. No face, no features, just pure luminous energy. Flat design with subtle depth, suitable for a professional AI research assistant avatar. High resolution, crisp edges.
```

**负面提示**：
```
No face, no eyes, no mouth, no robot features, no cartoon style, no realistic photo, no text, no background elements, no complex details, no gradient mesh artifacts
```

### 1b. 主头像 — Dark Mode

**尺寸**：同上
**提示词**：
```
A minimal abstract glowing orb icon on transparent background, designed for dark interfaces. The orb is a luminous sphere with an inner gradient from electric blue (#6C8AFF) on the left to golden amber (#FFB84D) on the right. Brighter and more emissive than its light-mode counterpart, with a prominent outer glow. The glow extends outward in concentric soft rings of warm amber light against darkness. Glass-like surface with a bright specular highlight. Clean, modern, ethereal. Conveys advanced technology with human warmth. Suitable as an AI assistant avatar on dark backgrounds. High resolution.
```

### 1c. 思考态头像（可选动图）

**尺寸**：256 × 256px
**格式**：APNG 或 Lottie JSON（如果模型不支持动图，提供 4 帧序列帧）
**帧数**：4 帧循环，每帧间隔 400ms

**提示词（序列帧 1-4）**：
```
Frame 1: A glowing orb (blue-to-amber gradient) with its glow halo at minimum intensity (subtle, close to the surface). Clean transparent background.

Frame 2: Same orb with glow halo expanded slightly outward, brightness increased by 20%. A few tiny luminous particles appear around the orb at random positions.

Frame 3: Same orb with glow halo at maximum expansion, brightness at peak. More particles visible, some trailing slightly as if orbiting. The amber tone is more prominent.

Frame 4: Same orb with glow beginning to contract back toward frame 1 state. Particles fading. Transitioning back to resting state.

Style: minimal, clean, tech aesthetic, transparent background, consistent orb size across all frames, suitable for looping animation.
```

**尺寸说明**：4 帧导出为独立 PNG，命名 `agent-thinking-1.png` ~ `agent-thinking-4.png`

---

## 2. 欢迎页背景纹理（可选）

### 2a. 微妙点阵纹理 — Light

**尺寸**：400 × 400px（平铺用）
**格式**：PNG，半透明

**提示词**：
```
A seamless tileable subtle dot grid pattern on transparent background. Tiny dots (1-2px) arranged in a regular grid with 20px spacing. Dot color is very light gray (#E5E7EB) at 30% opacity. Some dots are slightly larger (2-3px) and have a faint blue tint (#3B5BDB at 10% opacity), scattered randomly at about 5% frequency. Clean, minimal, tech-inspired. Suitable as a background texture for a professional web application. Must tile seamlessly in all directions.
```

### 2b. 微妙点阵纹理 — Dark

**尺寸**：同上

**提示词**：
```
A seamless tileable subtle dot grid pattern on transparent background for dark interfaces. Tiny dots (1-2px) in a regular grid with 20px spacing. Dot color is very dim white (#FFFFFF) at 8% opacity. Some dots are slightly larger and have a faint blue glow (#6C8AFF at 15% opacity), scattered randomly. Minimal, spacious, evokes a night sky or circuit board. Must tile seamlessly.
```

---

## 3. 完成页庆祝插图（可选）

### 3a. 光粒子散开效果

**尺寸**：800 × 400px
**格式**：PNG，透明背景
**比例**：2:1 横向

**提示词**：
```
An abstract celebration burst of soft light particles dispersing outward from a central point on transparent background. Particles are small circles in warm amber (#F59F00, #FFB84D) and cool blue (#6C8AFF, #3B5BDB) tones, varying in size from 2px to 8px. The burst pattern is organic and gentle, not explosive — more like a dandelion releasing seeds. Particles have motion blur trails suggesting gentle outward movement. The overall composition is centered, symmetrical but organic. Professional, elegant, suitable for a "task completed" celebration moment in a tech product. No confetti, no text, no icons.
```

---

## 4. 信任徽章图标（如果不用 Lucide）

**尺寸**：48 × 48px 每个
**格式**：SVG 优先，PNG 备选
**数量**：3 个

暂定使用 Lucide React 图标库的 `Clock`, `ShieldCheck`, `MessageCircleHeart`，如果视觉效果不够精致再考虑自定义生成。

---

## 资产交付清单

```
public/images/
├── agent-avatar.png              # 128×128 主头像 light
├── agent-avatar-dark.png         # 128×128 主头像 dark
├── agent-avatar-sm.png           # 32×32 消息列表用 light
├── agent-avatar-sm-dark.png      # 32×32 消息列表用 dark
├── agent-thinking-1.png          # 256×256 思考帧1（可选）
├── agent-thinking-2.png          # 256×256 思考帧2（可选）
├── agent-thinking-3.png          # 256×256 思考帧3（可选）
├── agent-thinking-4.png          # 256×256 思考帧4（可选）
├── bg-grid-light.png             # 400×400 背景纹理 light（可选）
├── bg-grid-dark.png              # 400×400 背景纹理 dark（可选）
└── completion-burst.png          # 800×400 完成庆祝（可选）
```

**优先级**：
- 🔴 P0：`agent-avatar.png` + `agent-avatar-sm.png`（含 dark 版本）— 没有这个无法开工
- 🟡 P1：`agent-thinking-*.png` — Phase 1c typing indicator 需要
- 🟢 P2：背景纹理 + 完成庆祝 — Phase 3-4 抛光阶段，可用 CSS 降级方案替代
