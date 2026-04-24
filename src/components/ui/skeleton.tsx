import React from "react";

/**
 * Skeleton — shimmer placeholder for loading states.
 * Uses a CSS-only gradient sweep so it works without JS and respects
 * `prefers-reduced-motion` via globals.css.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape. Defaults to "line" (rectangle with small radius). */
  shape?: "line" | "circle" | "pill";
  /** Override default animation (useful inside nested skeletons). */
  animated?: boolean;
}

export function Skeleton({
  shape = "line",
  animated = true,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const shapeClass =
    shape === "circle"
      ? "rounded-full aspect-square"
      : shape === "pill"
      ? "rounded-full"
      : "rounded-[var(--radius-xs)]";

  return (
    <div
      aria-hidden
      className={[
        "skeleton",
        shapeClass,
        animated ? "skeleton--animated" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      {...rest}
    />
  );
}

/** A line of text — pass `lines` to render multiple paragraphs of decreasing width. */
export function SkeletonText({
  lines = 3,
  lastLineWidth = "70%",
  className,
}: {
  lines?: number;
  lastLineWidth?: string;
  className?: string;
}) {
  return (
    <div className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? lastLineWidth : "100%" }}
        />
      ))}
    </div>
  );
}

/** A card-shaped skeleton: stat card, summary block, etc. */
export function SkeletonCard({
  showBadge = true,
  className,
}: {
  showBadge?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 flex flex-col gap-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showBadge && <Skeleton className="h-3 w-20" />}
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-3 w-full" style={{ width: "80%" }} />
    </div>
  );
}

/** A table row skeleton with N cells. */
export function SkeletonRow({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-3" style={{ width: i === 0 ? "60%" : "40%" }} />
        </td>
      ))}
    </tr>
  );
}
