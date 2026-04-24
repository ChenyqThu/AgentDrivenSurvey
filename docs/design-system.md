# Agent Driven Survey — Frontend Design System

[中文版](./design-system.zh-CN.md) · [Back to Architecture](./architecture.md) · [README](../README.md)

This document is the authoritative reference for the project's visual design
language, motion system, component library, and the agent-assisted workflow
that produces them. Read it before adding UI, before picking a color, and
before writing a new animation. The system is opinionated and the defaults
are load-bearing — deviate only with a reason.

---

## 1. Philosophy

### 1.1 Core thesis

> **AI doesn't generate bad UI because it lacks capability. It generates bad
> UI because nobody gives it the vocabulary to do better.**

This mirrors the product's own "depth over breadth" ethos. Five principles,
applied in order when in doubt:

1. **Depth over breadth.** Do three things exceptionally well; resist the
   urge to decorate every surface.
2. **Warm technology.** Pair every technical signal (gradient, shadow, tight
   grid) with a human signal (warm accent, microcopy, breathing glow). Pure
   cold tech feels corporate; pure warmth feels toy-like. Always both.
3. **Speak human.** Microcopy should sound like a person wrote it — specific,
   a little warm, never generic. "Something went wrong" is a failure.
4. **Respect the moment.** Animation duration matches weight: 100–150ms for
   micro-interactions, 200–300ms for standard UI, >300ms only for earned
   milestones (e.g. interview completion). No bounce easing on UI-mechanical
   actions — reserve it for celebration.
5. **Token-driven, systematically.** All colors, spacing, radius, shadows,
   and typography flow through CSS custom properties. Hardcoded Tailwind
   utilities (`bg-gray-900`, `text-blue-600`) are bugs.

These principles are encoded in [`.impeccable.md`](../.impeccable.md) at the
project root and loaded automatically by Impeccable skill commands.

### 1.2 Brand personality

Three words, codified at [`src/app/globals.css`](../src/app/globals.css):

| Word | Meaning | Expression |
|------|---------|------------|
| **科技 / Tech** | Modern, precise, considered | Geist typeface, tight tracking, soft shadows over hard borders |
| **可靠 / Reliable** | Consistent, predictable | No bouncy springs on "Submit" buttons, generous touch targets |
| **温暖 / Warm** | Counterbalance to the tech | Orange warm accent, breathing avatar glow, human microcopy |

**Voice:** conversational but not casual — like a smart friend with a
clipboard. **Emotional arc:** trust → curiosity → being-heard → closure.

### 1.3 Register map

Impeccable distinguishes **brand** (expressive) from **product** (functional).
This project uses both:

| Surface | Register | Rationale |
|---|---|---|
| `/s/[surveyId]` welcome + chat + completion | **brand** | First impression, emotional arc, single-session stakes |
| `src/components/chat/*` | **brand** | Part of the respondent experience |
| `/admin/*` | **product** | Task interface for professional users |
| `src/components/ui/*` | **product** primitives | Composed by both layers above |

Impeccable commands (`/polish`, `/animate`, `/critique`, `/bolder`,
`/quieter`) adjust their vocabulary automatically based on the target path.

---

## 2. Agent-Assisted Workflow

The system explicitly treats the AI coding agent as a first-class design
collaborator, and pipes design vocabulary into every prompt.

### 2.1 Skills consumed

| Skill | Role |
|---|---|
| [`pbakaus/impeccable`](https://github.com/pbakaus/impeccable) | Design vocabulary layer — 20 slash commands (`/audit`, `/polish`, `/critique`, `/animate`, `/arrange`, `/typeset`, `/colorize`, `/bolder`, `/quieter`, `/delight`, `/distill`, `/harden`, `/normalize`, `/extract`, `/clarify`, `/adapt`, `/onboard`, `/simplify`, `/overdrive`, `/teach-impeccable`) |
| [`emil-design-eng`](https://agnxi.com/emilkowalski/skills/emil-design-eng) | Encoded "taste" from Emil Kowalski — animation durations, easing rules, micro-interaction polish |
| [`pixel-point/animate-text`](https://pixelpoint.io/skills/animate-text/) | 24 curated text animation specs (JSON contracts) — hero-title reveals, word crossfades, typewriter, etc. |
| [`anthropic-skills:frontend-design`](https://github.com/anthropics/skills) | Anthropic's upstream foundational skill — Impeccable layers on top of this |

Install these once via `npx skills add <pkg>`. The skill lockfile is
committed as [`skills-lock.json`](../skills-lock.json); the installed skill
content lives under `.agents/` (gitignored — reproducible from lockfile).

### 2.2 Project design context

`.impeccable.md` at the repo root captures the project-specific knobs that
tune those generic skills:

- Users (respondents + admins) and what they need emotionally
- Brand personality + voice + emotional arc
- References and anti-references
- Theme toggle (light + dark, both must ship)
- Accessibility baseline (WCAG AA, reduced motion, 44px touch)
- Reusable assets worth knowing about before writing anything new

Regenerate with `/teach-impeccable` if brand positioning shifts.

### 2.3 When to run which command

| Goal | Command | Typical scope |
|---|---|---|
| Bring unpolished code up to system standard | `/normalize <path>` | Admin pages, new components |
| Add spring-driven micro-interactions | `/animate <path>` | Any UI with state changes |
| Get a structured UX audit | `/critique <path>` | Per-feature, before shipping |
| Full technical quality sweep | `/audit <path>` | Before major releases |
| Final micro-detail pass | `/polish <path>` | After everything else |
| Handle edge cases + i18n + overflow | `/harden <path>` | Before production |
| Add celebratory / memorable moments | `/delight <path>` | High-value user milestones |

---

## 3. Design Tokens

All tokens live in [`src/app/globals.css`](../src/app/globals.css), defined
as CSS custom properties on `:root` with a `prefers-color-scheme: dark`
override. Never inline a hex color — if a value doesn't have a token yet,
add a token.

### 3.1 Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg-primary` | `#FAFBFD` | `#0F1117` | Page background |
| `--bg-surface` | `#FFFFFF` | `#181B25` | Cards, panels |
| `--bg-surface-raised` | `#F4F5F7` | `#1E2130` | Hover states, skeletons, code blocks |
| `--bg-overlay` | translucent | translucent | Glass headers (with `.glass` blur) |
| `--bg-chat` | gradient | gradient | Chat background |
| `--accent-primary` | `#3B5BDB` | `#6C8AFF` | Primary action, focus ring |
| `--accent-primary-soft` | 8% tint | 12% tint | Selected state backdrop |
| `--accent-warm` | `#F59F00` | `#FFB84D` | Warmth, avatar glow, "pause" actions |
| `--accent-success` | `#2B8A3E` | `#51CF66` | Publish, active state |
| `--accent-danger` | `#E03131` | `#FF6B6B` | Destructive actions, errors |
| `--text-primary` | `#1A1D26` | `#E8EAF0` | Headings, body |
| `--text-secondary` | `#6B7280` | `#9CA3AF` | Descriptions |
| `--text-tertiary` | `#9CA3AF` | `#6B7280` | Hints, captions |
| `--border-subtle` | `#E5E7EB` | `#2A2D3A` | Dividers, card outlines |
| `--border-interactive` | 20% `accent-primary` | 20% `accent-primary` | Focus, selection |

### 3.2 Spacing & radius

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 6px | Inputs, small buttons |
| `--radius-sm` | 10px | Standard buttons, form fields |
| `--radius-md` | 14px | Cards |
| `--radius-lg` | 20px | Modals, featured surfaces |
| `--radius-xl` | 28px | Pill buttons, hero CTAs |
| `--radius-full` | 9999px | Avatars, badges, dots |

Spacing uses Tailwind's 4px grid. Do not add custom spacing tokens unless a
value repeats in 3+ places.

### 3.3 Shadows & glow

| Token | Purpose |
|---|---|
| `--shadow-sm` | Subtle elevation (sticky headers, form fields) |
| `--shadow-md` | Buttons, hover-raised cards |
| `--shadow-lg` | Modals, featured surfaces |
| `--shadow-card` | Default card elevation (softer than `shadow-sm`) |
| `--shadow-glow-warm` | Warm glow (welcome CTA, completion avatar) |
| `--shadow-glow-blue` | Primary glow (slider thumb active, focus) |

### 3.4 Typography

Fonts: **Geist Sans** + **Geist Mono** via `next/font/google`. Sizes are
tokenized:

| Token | Value | Use |
|---|---|---|
| `--type-display-size` / `-weight` / `-line` / `-tracking` | 32px / 700 / 1.15 / -0.02em | `<h1>` hero headlines |
| `--type-title-size` / `-weight` / `-line` | 20px / 600 / 1.3 | Section titles |
| `--type-body-size` / `-line` | 14px / 1.5 | Body copy |
| `--type-caption-size` / `-line` / `-tracking` | 12px / 1.4 / 0.01em | Hints, captions |
| `--type-heading-1` / `-2` / `-3` | 16 / 15 / 14px | Markdown-rendered headings |

### 3.5 Gradients

| Token | Purpose |
|---|---|
| `--gradient-hero` | Primary brand gradient — `#3B5BDB → #6C8AFF → #F59F00` (linear 135°). Use on single most-important CTA per view |
| `--gradient-warm-glow` | Radial soft warmth for avatar halos and celebration backgrounds |
| `--gradient-nps-low` / `-mid` / `-high` | Per-segment NPS tint chips (dark-mode boosted to 28% for legible contrast) |
| `--gradient-shimmer` | Horizontal sweep for `.skeleton` placeholders |

---

## 4. Motion System

All motion tokens live in [`src/lib/motion.ts`](../src/lib/motion.ts). Prefer
reusing existing variants over inventing new ones.

### 4.1 Springs

```ts
springs.gentle  // { stiffness: 120, damping: 20 }  — message entrance, card expand
springs.snappy  // { stiffness: 300, damping: 24 }  — button feedback, chevrons
springs.bounce  // { stiffness: 400, damping: 15 }  — checkmark pop, confetti trigger (celebration ONLY)
```

### 4.2 Durations

```ts
durations.instant  = 0.1s   // Micro-interactions (hover, focus)
durations.fast     = 0.2s   // Standard UI transitions
durations.normal   = 0.3s   // Card expansion, page-level
durations.slow     = 0.5s   // Multi-element stagger
durations.dramatic = 0.8s   // Earned milestones (completion glow)
```

Emil's rule applies: if a duration is >300ms and isn't a celebration, ask
why.

### 4.3 Variants

| Variant | Use |
|---|---|
| `fadeUpVariants` | General-purpose entrance (opacity + y:16→0) |
| `fadeInVariants` | Opacity-only |
| `messageAIVariants` | AI message bubble (enters from left, springs.200/20) |
| `messageUserVariants` | User bubble (from right, springs.260/22) |
| `cardExpandVariants` | Interactive card entrance (opacity + y + scale, staggered child timing) |
| `staggerContainer(delay)` | Parent for stagger-animated children |
| `slideDownVariants` | Header / banner entrance |
| `welcomeSequence` | Welcome screen container + item |
| `completionSequence` | Completion card container + glow + text |
| `scaleTap` | `{ whileTap: { scale: 0.95 }, transition: springs.snappy }` |
| `scaleHover` | `{ whileHover: { scale: 1.02, y: -1 }, transition: springs.gentle }` |

### 4.4 Reduced motion

`globals.css` globally honors `prefers-reduced-motion: reduce` — all CSS
animations and transitions clamp to 0.01ms. When adding new Framer Motion
variants, verify they degrade meaningfully (usually automatic via the
framework, but test it).

---

## 5. Component Library

Located at [`src/components/ui/`](../src/components/ui/). All are token-driven
and both light/dark-ready.

### 5.1 Button — [`button.tsx`](../src/components/ui/button.tsx) + [`button-styles.ts`](../src/components/ui/button-styles.ts)

7 variants × 3 sizes, with loading state, icons, and built-in motion:

```tsx
<Button variant="primary" size="md" loading={isSubmitting}>
  Publish Survey
</Button>
```

| Variant | When to use |
|---|---|
| `primary` | Hero gradient — reserve for the single most important CTA per view |
| `secondary` | Solid accent — standard CTAs (Copy, Submit) |
| `outline` | Bordered — tertiary actions (Export CSV, View Responses) |
| `ghost` | Text-only — quiet actions (Cancel, View) |
| `success` | Publish, Resume |
| `warm` | Pause, downgrade actions |
| `danger` | Destructive (Delete, Close permanently) |

**Client/server split:** `Button` is a client component (it uses Framer
Motion). When rendering a visually-identical button from a server component
(e.g. as a `<Link>`), import `buttonClassName` from `button-styles.ts` instead:

```tsx
// server component
import { buttonClassName } from "@/components/ui/button-styles";

<Link href="/admin/surveys/new" className={buttonClassName("primary", "md")}>
  + New Survey
</Link>
```

### 5.2 StatusBadge — [`status-badge.tsx`](../src/components/ui/status-badge.tsx)

Maps domain status strings to design tones. Supports survey states
(`draft / active / paused / closed`) and session states
(`active / completed / abandoned`):

```tsx
<StatusBadge status={survey.status} size="sm" />
<StatusBadge status="custom" tone="warning" label="Needs Review" />
```

### 5.3 Skeleton — [`skeleton.tsx`](../src/components/ui/skeleton.tsx)

Primitives + presets. CSS-only shimmer, honors `prefers-reduced-motion`:

```tsx
<Skeleton className="h-4 w-32" />           // primitive
<SkeletonText lines={3} />                   // paragraph
<SkeletonCard />                             // stat-card shape
<SkeletonRow columns={5} />                  // table row
```

Use whenever async data gates the UI — never show a bare "Loading…" string.

### 5.4 AnimatedText — [`animated-text.tsx`](../src/components/ui/animated-text.tsx)

Translated from `pixel-point/animate-text` spec JSONs. Reserve for hero and
celebratory moments — not every heading.

| Component | Spec | Parameters | Use case |
|---|---|---|---|
| `SoftBlurIn` | `soft-blur-in` (per-character, auto-switches to per-word above 40ch) | 900ms duration, 25ms stagger, y 16→0, blur 12→0, cubic-bezier(0.22, 1, 0.36, 1) | Welcome hero titles |
| `PerWordCrossfade` | `per-word-crossfade` | 700ms duration, 70ms stagger, y 8→0, cubic-bezier(0.16, 1, 0.3, 1) | Section titles, completion moments |
| `CountUp` | — (custom, uses `useSpring` + `useInView`) | stiffness 90, damping 22, mass 0.9, once | Dashboard numerics |

```tsx
<SoftBlurIn as="h1" text={survey.title} delay={0.1} className="text-[var(--type-display-size)]" />
<PerWordCrossfade as="p" text="Interview Complete" />
<CountUp value={42} className="text-[32px]" />
```

Avoid stacking text animations on top of SSE streaming text (double
effect). Avoid on button labels (breaks affordance).

### 5.5 Dashboard view — [`src/components/admin/dashboard-view.tsx`](../src/components/admin/dashboard-view.tsx)

Client wrapper embedded inside the admin dashboard server component. Owns:
- Staggered stat-card entrance (with `CountUp` values)
- Staggered survey-list row entrance
- Hover lift
- Empty state with illustration

Pattern worth replicating whenever a server page needs client-side motion
without converting the entire page to `"use client"`.

---

## 6. Accessibility

Baseline targets (enforced in code review):

- **WCAG AA** contrast for all text. Token palette is audited; if you deviate
  from tokens, you're on the hook for re-auditing.
- **Reduced motion** — `prefers-reduced-motion: reduce` is respected globally.
  `.avatar-breathe` and `.skeleton--animated` explicitly opt out of animation
  under this query.
- **Touch targets** — 44px minimum on mobile surfaces. NPS / card buttons use
  `min-h-[44px]`.
- **Focus rings** — all interactive elements show a visible ring via
  `focus-visible:ring-[var(--accent-primary)]`. Never `outline: none` without
  a visible replacement.
- **Screen readers** — Chat message list has `role="log"`; live counters
  (e.g. multi-select "已选 N") use `aria-live="polite"`. Interactive cards
  expose `aria-label`.

---

## 7. Extending the System

### 7.1 Adding a token

1. Add to `:root` in [`globals.css`](../src/app/globals.css) with light value.
2. Mirror in the `@media (prefers-color-scheme: dark)` block.
3. Document here in §3.

### 7.2 Adding a motion variant

1. Prefer reusing an existing variant from [`motion.ts`](../src/lib/motion.ts).
2. If genuinely new, add with a one-line JSDoc comment explaining when to use.
3. Document here in §4.3.

### 7.3 Adding a component

1. Scope check: is it reused across ≥2 surfaces? If no, keep it local.
2. Decide client vs server — if it uses motion, hooks, or interactivity,
   `"use client"`. Otherwise keep it server (faster, smaller bundle).
3. Token-only styling (no hardcoded colors).
4. Document here in §5.

### 7.4 Pre-ship checklist

Before merging any UI-visible PR:

```bash
# 1. Type + lint
npx tsc --noEmit
npx eslint .

# 2. Hardcoded color sweep (must return 0 hits inside src/app + src/components)
rg "bg-(gray|blue|yellow|red|green|orange|purple|pink|indigo|emerald|amber|rose)-\d+" src/app src/components src/hooks

# 3. Production build
npm run build

# 4. Skill-driven quality pass (pick per change)
/polish <changed-path>     # final micro-detail pass
/critique <changed-path>   # UX audit
/audit <changed-path>      # technical quality check
```

Manual visual QA across light + dark mode, mobile (390×844) +
desktop (1440×900), and with `prefers-reduced-motion: reduce`.

---

## 8. References

- [`.impeccable.md`](../.impeccable.md) — project design context (auto-loaded by Impeccable)
- [Emil Kowalski — Agents with Taste](https://emilkowal.ski/ui/agents-with-taste) — methodology behind the skills
- [Impeccable design system](https://impeccable.style) — the vocabulary layer
- [pixel-point/animate-text](https://pixelpoint.io/skills/animate-text/) — text animation specs
- [Architecture doc](./architecture.md) — how design system fits the larger system

_Last updated: 2026-04-24._
