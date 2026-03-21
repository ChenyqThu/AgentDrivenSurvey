/**
 * Motion Design Tokens
 * Framer Motion animation presets for the survey chat UI
 */

// ── Spring Configs ──
export const springs = {
  /** Gentle spring for message entrance, card expansion */
  gentle: { type: "spring" as const, stiffness: 120, damping: 20 },
  /** Snappy spring for button feedback, send actions */
  snappy: { type: "spring" as const, stiffness: 300, damping: 24 },
  /** Bouncy spring for card selection, celebration */
  bounce: { type: "spring" as const, stiffness: 400, damping: 15 },
};

// ── Duration Presets (seconds) ──
export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  dramatic: 0.8,
};

// ── Stagger Presets (seconds) ──
export const stagger = {
  fast: 0.03,
  normal: 0.06,
  slow: 0.1,
};

// ── Reusable Animation Variants ──

/** Message bubble entrance — AI (from left) */
export const messageAIVariants = {
  initial: { opacity: 0, x: -12, y: 4, scale: 0.97 },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/** Message bubble entrance — User (from right) */
export const messageUserVariants = {
  initial: { opacity: 0, x: 12, y: 4, scale: 0.97 },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/** Fade up — general purpose entrance */
export const fadeUpVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal, ease: [0.25, 0.1, 0.25, 1.0] as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: durations.fast },
  },
};

/** Fade in — simple opacity */
export const fadeInVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: durations.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast },
  },
};

/** Card expand — interactive card entrance (GPU-accelerated, no height animation) */
export const cardExpandVariants = {
  initial: { opacity: 0, y: 10, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      opacity: { duration: durations.normal, delay: 0.05 },
      y: { ...springs.gentle, delay: 0.05 },
      scale: { ...springs.gentle, delay: 0.05 },
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.97,
    transition: { duration: durations.fast },
  },
};

/** Stagger container — for lists of items */
export const staggerContainer = (staggerDelay: number = stagger.normal) => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

/** Scale tap — button press feedback */
export const scaleTap = {
  whileTap: { scale: 0.95 },
  transition: springs.snappy,
};

/** Scale hover — subtle lift */
export const scaleHover = {
  whileHover: { scale: 1.02, y: -1 },
  transition: springs.gentle,
};

/** Slide down — for header/banner entrance */
export const slideDownVariants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: durations.fast },
  },
};

/** Welcome page stagger sequence */
export const welcomeSequence = {
  container: {
    animate: {
      transition: { staggerChildren: stagger.slow, delayChildren: 0.2 },
    },
  },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: durations.slow, ease: [0.25, 0.1, 0.25, 1.0] as const },
    },
  },
};

/** Completion celebration sequence */
export const completionSequence = {
  container: {
    animate: {
      transition: { staggerChildren: 0.15, delayChildren: 0.3 },
    },
  },
  glow: {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { ...springs.gentle, duration: durations.dramatic },
    },
  },
  text: {
    initial: { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: durations.slow },
    },
  },
};

/** Breathing glow animation for AI avatar — CSS keyframe config */
export const breathingGlow = {
  animate: {
    boxShadow: [
      "0 0 12px rgba(245, 159, 0, 0.10), 0 0 24px rgba(245, 159, 0, 0.05)",
      "0 0 20px rgba(245, 159, 0, 0.20), 0 0 40px rgba(245, 159, 0, 0.10)",
      "0 0 12px rgba(245, 159, 0, 0.10), 0 0 24px rgba(245, 159, 0, 0.05)",
    ],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};
