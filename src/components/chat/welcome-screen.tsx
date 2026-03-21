"use client";

import { motion } from "motion/react";
import { Clock, ShieldCheck, MessageCircleHeart, ArrowRight } from "lucide-react";
import { AvatarOrb } from "./avatar-orb";

interface WelcomeScreenProps {
  title: string;
  description?: string | null;
  onStart: () => void;
}

const containerVariants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] as const },
  },
};

const badgeContainerVariants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.5 },
  },
};

const badgeVariants = {
  initial: { opacity: 0, y: 12, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] as const },
  },
};

const TRUST_BADGES = [
  { icon: Clock, label: "10–15 min", key: "time" },
  { icon: ShieldCheck, label: "Confidential", key: "privacy" },
  { icon: MessageCircleHeart, label: "No wrong answers", key: "comfort" },
] as const;

export function WelcomeScreen({ title, description, onStart }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <motion.div
        className="text-center w-full max-w-md"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {/* AI Avatar Orb */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-8"
        >
          <AvatarOrb size={80} className="shadow-[var(--shadow-glow-warm)]" />
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="font-semibold mb-3 leading-snug"
          style={{
            fontSize: "var(--type-display-size)",
            fontWeight: "var(--type-display-weight)",
            lineHeight: "var(--type-display-line)",
            letterSpacing: "var(--type-display-tracking)",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-[15px] leading-relaxed mb-8 max-w-sm mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          {description ??
            "We'd love to hear about your experience in a quick, friendly conversation. Your honest thoughts help us build something better."}
        </motion.p>

        {/* Trust badges */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-8"
          variants={badgeContainerVariants}
          initial="initial"
          animate="animate"
        >
          {TRUST_BADGES.map(({ icon: Icon, label, key }) => (
            <motion.div
              key={key}
              variants={badgeVariants}
              className="flex items-center gap-2 px-3.5 py-2 rounded-[10px]"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <Icon
                size={15}
                style={{ color: "var(--accent-warm)" }}
                strokeWidth={2}
              />
              <span
                className="text-[12px] font-medium whitespace-nowrap"
                style={{ color: "var(--text-secondary)" }}
              >
                {label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={itemVariants}>
          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 text-white font-semibold rounded-[28px] text-[16px] min-h-[48px] cursor-pointer"
            style={{
              background: "var(--gradient-hero)",
              boxShadow: "var(--shadow-glow-warm)",
            }}
          >
            Start the Conversation
            <ArrowRight size={18} strokeWidth={2.5} />
          </motion.button>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          variants={itemVariants}
          className="text-[12px] mt-5"
          style={{ color: "var(--text-tertiary)" }}
        >
          Skip any question or stop anytime — no pressure at all.
        </motion.p>
      </motion.div>
    </div>
  );
}
