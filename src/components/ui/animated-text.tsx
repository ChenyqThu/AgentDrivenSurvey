"use client";

import React, { useEffect, useRef } from "react";
import {
  motion,
  useSpring,
  useMotionValue,
  useTransform,
  useInView,
} from "motion/react";

/**
 * Text animations translated from `pixel-point/animate-text` specs.
 * Both effects degrade to static text under `prefers-reduced-motion`
 * thanks to the global CSS rule in globals.css.
 */

// ── Soft Blur In (per-character) ───────────────────────────
// Spec: soft-blur-in — duration 900ms, stagger 25ms,
// easing cubic-bezier(0.22, 1, 0.36, 1), y 16→0, blur 12→0
// Use for hero-weight titles. Skill note: on copy > 40 chars, switch to per-word.
export interface SoftBlurInProps {
  text: string;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof React.JSX.IntrinsicElements;
}

const SOFT_BLUR_EASE = [0.22, 1, 0.36, 1] as const;

export function SoftBlurIn({
  text,
  delay = 0,
  className,
  style,
  as = "span",
}: SoftBlurInProps) {
  // Auto-switch to per-word on long copy (>40 chars) per spec guidance.
  const perWord = text.length > 40;
  const tokens = perWord ? text.split(/(\s+)/) : Array.from(text);

  const Tag = motion[as as keyof typeof motion] as React.ElementType;

  return (
    <Tag
      className={className}
      style={style}
      aria-label={text}
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: perWord ? 0.04 : 0.025,
            delayChildren: delay,
          },
        },
      }}
    >
      {tokens.map((token, i) =>
        /^\s+$/.test(token) ? (
          <span key={`sp-${i}`} aria-hidden>
            {token}
          </span>
        ) : (
          <motion.span
            key={`${token}-${i}`}
            aria-hidden
            style={{ display: "inline-block", willChange: "transform, filter, opacity" }}
            variants={{
              initial: { opacity: 0, y: 16, filter: "blur(12px)" },
              animate: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: {
                  duration: 0.9,
                  ease: SOFT_BLUR_EASE,
                },
              },
            }}
          >
            {token}
          </motion.span>
        )
      )}
    </Tag>
  );
}

// ── Per-Word Crossfade ─────────────────────────────────────
// Spec: per-word-crossfade — duration 700ms, stagger 70ms,
// easing cubic-bezier(0.16, 1, 0.3, 1), y 8→0
// Calm keynote rhythm. Good for section titles and celebratory moments.
export interface PerWordCrossfadeProps {
  text: string;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof React.JSX.IntrinsicElements;
}

const CROSSFADE_EASE = [0.16, 1, 0.3, 1] as const;

export function PerWordCrossfade({
  text,
  delay = 0,
  className,
  style,
  as = "span",
}: PerWordCrossfadeProps) {
  const words = text.split(/(\s+)/);
  const Tag = motion[as as keyof typeof motion] as React.ElementType;

  return (
    <Tag
      className={className}
      style={style}
      aria-label={text}
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: { staggerChildren: 0.07, delayChildren: delay },
        },
      }}
    >
      {words.map((word, i) =>
        /^\s+$/.test(word) ? (
          <span key={`sp-${i}`} aria-hidden>
            {word}
          </span>
        ) : (
          <motion.span
            key={`${word}-${i}`}
            aria-hidden
            style={{ display: "inline-block" }}
            variants={{
              initial: { opacity: 0, y: 8 },
              animate: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.7, ease: CROSSFADE_EASE },
              },
            }}
          >
            {word}
          </motion.span>
        )
      )}
    </Tag>
  );
}

// ── Count Up ───────────────────────────────────────────────
// Numeric count-up using a spring. Triggers on enter-viewport so the
// user sees the animation even when scrolled past.
export interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function CountUp({ value, className, style }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 90,
    damping: 22,
    mass: 0.9,
  });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ ...style, fontVariantNumeric: "tabular-nums" }}
    >
      {display}
    </motion.span>
  );
}
