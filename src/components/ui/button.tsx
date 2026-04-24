"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import React, { forwardRef } from "react";
import { springs } from "@/lib/motion";
import {
  buttonClassName,
  type ButtonVariant,
  type ButtonSize,
} from "./button-styles";

// Re-export the pure style utilities for ergonomic imports from client code.
export { buttonClassName };
export type { ButtonVariant, ButtonSize };

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--gradient-hero)",
    color: "var(--text-on-accent)",
    boxShadow: "var(--shadow-md)",
  },
  secondary: {
    background: "var(--accent-primary)",
    color: "var(--text-on-accent)",
    boxShadow: "var(--shadow-sm)",
  },
  outline: {
    background: "transparent",
    color: "var(--text-primary)",
    border: "1px solid var(--border-subtle)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
  },
  success: {
    background: "var(--accent-success)",
    color: "var(--text-on-accent)",
    boxShadow: "var(--shadow-sm)",
  },
  warm: {
    background: "var(--accent-warm)",
    color: "var(--text-on-accent)",
    boxShadow: "var(--shadow-sm)",
  },
  danger: {
    background: "var(--accent-danger)",
    color: "var(--text-on-accent)",
    boxShadow: "var(--shadow-sm)",
  },
};

// ── Button ────────────────────────────────────────────────
export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      className,
      style,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileHover={isDisabled ? undefined : { y: -1 }}
        whileTap={isDisabled ? undefined : { scale: 0.97 }}
        transition={springs.snappy}
        className={[buttonClassName(variant, size), className].filter(Boolean).join(" ")}
        style={
          variant === "primary"
            ? { ...variantStyles.primary, ...style }
            : style
        }
        {...rest}
      >
        {loading ? (
          <Spinner />
        ) : leftIcon ? (
          <span aria-hidden className="inline-flex items-center">
            {leftIcon}
          </span>
        ) : null}
        <span>{children}</span>
        {!loading && rightIcon ? (
          <span aria-hidden className="inline-flex items-center">
            {rightIcon}
          </span>
        ) : null}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

// ── Spinner ────────────────────────────────────────────────
function Spinner() {
  return (
    <motion.svg
      aria-hidden
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}
