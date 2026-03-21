"use client";

import { useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { AvatarOrb } from "./avatar-orb";
import { completionSequence } from "@/lib/motion";

interface CompletionCardProps {
  onRestart?: () => void;
}

export function CompletionCard({ onRestart }: CompletionCardProps) {
  const avatarControls = useAnimationControls();
  const [tapped, setTapped] = useState(false);

  async function handleAvatarTap() {
    if (tapped) return;
    setTapped(true);
    await avatarControls.start({
      rotate: [0, 360],
      scale: [1, 1.3, 1],
      transition: { duration: 0.6, ease: "easeInOut" },
    });
    setTapped(false);
  }

  return (
    <motion.div
      className="flex-shrink-0 px-4 py-8"
      variants={completionSequence.container}
      initial="initial"
      animate="animate"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-3xl mx-auto text-center">
        {/* Avatar orb with warm glow */}
        <motion.div
          className="relative inline-flex items-center justify-center mb-4"
          variants={completionSequence.glow}
        >
          {/* Warm glow backdrop */}
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-40"
            style={{ background: "var(--gradient-warm-glow)" }}
          />
          {/* Avatar orb — tappable spin easter egg */}
          <motion.div
            animate={avatarControls}
            onClick={handleAvatarTap}
            className="cursor-pointer"
            whileHover={{ scale: 1.05 }}
          >
            <AvatarOrb size={48} className="shadow-[0_0_20px_rgba(245,159,0,0.25),0_0_40px_rgba(59,91,219,0.15)]" />
          </motion.div>
          {/* Green checkmark badge */}
          <div className="absolute -bottom-1 -right-1 rounded-full bg-[var(--bg-primary)] p-0.5">
            <CheckCircle2 className="w-4 h-4" style={{ color: "var(--accent-success)" }} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.p
          className="text-lg font-semibold text-[var(--text-primary)] mb-2"
          variants={completionSequence.text}
        >
          Interview Complete
        </motion.p>

        {/* Subtitle */}
        <motion.p
          className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed"
          variants={completionSequence.text}
        >
          Thank you for sharing! Your responses will directly help us make better product decisions.
        </motion.p>

        {/* Restart button */}
        {onRestart && (
          <motion.div variants={completionSequence.text} className="mt-6">
            <motion.button
              onClick={onRestart}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-soft)] hover:text-[var(--text-primary)]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Start a new conversation
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
