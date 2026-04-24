/**
 * Pure styling utilities for Button — safe to import from server components.
 * The interactive <Button /> motion component lives in `./button` and is
 * client-only. Use these class helpers when you need the button *look* on
 * a <Link /> or <a /> rendered from a server component.
 */

export type ButtonVariant =
  | "primary" // gradient hero — reserve for the single most important CTA per view
  | "secondary" // solid accent-primary
  | "outline" // bordered, subtle
  | "ghost" // text-only, lightest weight
  | "success" // solid accent-success (e.g. Publish)
  | "warm" // solid accent-warm (e.g. Pause)
  | "danger"; // solid accent-danger (e.g. Delete)

export type ButtonSize = "sm" | "md" | "lg";

export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-xs)]",
  md: "h-9 px-4 text-sm gap-2 rounded-[var(--radius-sm)]",
  lg: "h-11 px-6 text-sm font-semibold gap-2 rounded-[var(--radius-sm)]",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md"
): string {
  return [
    "inline-flex items-center justify-center font-medium",
    "transition-[background-color,box-shadow,border-color,color,transform] duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-primary)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    buttonSizeClasses[size],
    variant === "primary" &&
      "text-[var(--text-on-accent)] shadow-[var(--shadow-md)]",
    variant === "secondary" &&
      "bg-[var(--accent-primary)] text-[var(--text-on-accent)] hover:bg-[var(--accent-primary-hover)] shadow-[var(--shadow-sm)]",
    variant === "outline" &&
      "border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)] hover:border-[var(--border-interactive)]",
    variant === "ghost" &&
      "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)]",
    variant === "success" &&
      "bg-[var(--accent-success)] text-[var(--text-on-accent)] hover:opacity-95 shadow-[var(--shadow-sm)]",
    variant === "warm" &&
      "bg-[var(--accent-warm)] text-[var(--text-on-accent)] hover:bg-[var(--accent-warm-hover)] shadow-[var(--shadow-sm)]",
    variant === "danger" &&
      "bg-[var(--accent-danger)] text-[var(--text-on-accent)] hover:opacity-95 shadow-[var(--shadow-sm)]",
  ]
    .filter(Boolean)
    .join(" ");
}
