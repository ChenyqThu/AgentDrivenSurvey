import React from "react";

// ── Status taxonomy ────────────────────────────────────────
// Surveys: draft | active | paused | closed
// Sessions: active | completed | abandoned
// Unified here — colors derived from design tokens only.

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const STATUS_TONE: Record<string, Tone> = {
  // survey states
  draft: "warning",
  active: "success",
  paused: "warning",
  closed: "neutral",
  // session states
  completed: "info",
  abandoned: "neutral",
  // extensible defaults
  published: "success",
  archived: "neutral",
  error: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  closed: "Closed",
  completed: "Completed",
  abandoned: "Abandoned",
  published: "Published",
  archived: "Archived",
  error: "Error",
};

type BadgeSize = "sm" | "md";

const sizeClasses: Record<BadgeSize, string> = {
  sm: "text-[11px] px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-0.5 gap-1.5",
};

const toneStyles: Record<
  Tone,
  { bg: string; color: string; dot: string }
> = {
  neutral: {
    bg: "var(--bg-surface-raised)",
    color: "var(--text-secondary)",
    dot: "var(--text-tertiary)",
  },
  info: {
    bg: "var(--accent-primary-soft)",
    color: "var(--accent-primary)",
    dot: "var(--accent-primary)",
  },
  success: {
    bg: "var(--accent-success-soft)",
    color: "var(--accent-success)",
    dot: "var(--accent-success)",
  },
  warning: {
    bg: "var(--accent-warm-soft)",
    color: "var(--accent-warm-hover)",
    dot: "var(--accent-warm)",
  },
  danger: {
    bg: "var(--accent-danger-soft)",
    color: "var(--accent-danger)",
    dot: "var(--accent-danger)",
  },
};

export interface StatusBadgeProps {
  /** A known status key (e.g. "active", "draft"). Unknown keys fall back to neutral. */
  status: string;
  /** Override label text. Defaults to a prettified version of `status`. */
  label?: string;
  /** Force a tone (ignores the status→tone lookup). */
  tone?: Tone;
  /** Show a colored leading dot. Default: true. */
  dot?: boolean;
  size?: BadgeSize;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  tone,
  dot = true,
  size = "md",
  className,
}: StatusBadgeProps) {
  const effectiveTone: Tone = tone ?? STATUS_TONE[status] ?? "neutral";
  const effectiveLabel =
    label ?? STATUS_LABEL[status] ?? capitalize(status);
  const t = toneStyles[effectiveTone];

  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-medium capitalize whitespace-nowrap",
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ background: t.bg, color: t.color }}
    >
      {dot && (
        <span
          aria-hidden
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: t.dot }}
        />
      )}
      {effectiveLabel}
    </span>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
