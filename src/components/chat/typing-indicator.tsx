"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AvatarOrb } from "./avatar-orb";

const QUIRKY_PHRASES = [
  "Warming up the microphone...",
  "Brewing some coffee...",
  "Tidying up the desk...",
  "Stretching before the chat...",
  "Putting on my researcher hat...",
  "Sharpening my pencil...",
  "Reviewing my notes...",
  "Getting into the zone...",
  "Clearing my throat...",
  "Finding the right words...",
  "Thinking deeply...",
  "Connecting the dots...",
  "Dusting off the clipboard...",
  "Adjusting my glasses...",
  "Taking a deep breath...",
  "Polishing my questions...",
  "Tuning in carefully...",
  "Warming up the neurons...",
];

function pickRandom(): string {
  return QUIRKY_PHRASES[Math.floor(Math.random() * QUIRKY_PHRASES.length)];
}

/**
 * Inline typing indicator — renders INSIDE an AI message bubble
 * when content hasn't arrived yet.
 */
export function InlineTypingIndicator() {
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    setPhrase(pickRandom());
    const interval = setInterval(() => setPhrase(pickRandom()), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2.5">
      {/* Dots group with warm glow */}
      <div
        className="flex items-center gap-1"
        style={{
          filter:
            "drop-shadow(0 0 4px color-mix(in srgb, #F59F00 30%, #3B5BDB 20%))",
        }}
      >
        <span
          className="typing-dot rounded-full"
          style={{
            width: 5,
            height: 5,
            background: "linear-gradient(135deg, #3B5BDB, #6E8EF0)",
            animationDelay: "0s",
          }}
        />
        <span
          className="typing-dot rounded-full"
          style={{
            width: 6,
            height: 6,
            background: "linear-gradient(135deg, #6E8EF0, #D4A855)",
            animationDelay: "0.2s",
          }}
        />
        <span
          className="typing-dot rounded-full"
          style={{
            width: 5,
            height: 5,
            background: "linear-gradient(135deg, #D4A855, #F59F00)",
            animationDelay: "0.4s",
          }}
        />
      </div>

      {/* Phrase crossfade */}
      <AnimatePresence mode="wait">
        <motion.span
          key={phrase}
          variants={{
            enter: { opacity: 0, y: 4 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
            exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
          }}
          initial="enter"
          animate="visible"
          exit="exit"
          className="text-[12px] italic"
          style={{ color: "var(--text-tertiary)" }}
        >
          {phrase}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/**
 * Standalone typing indicator — used in the "preparing" phase before chat starts.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 px-4 py-2">
      {/* AI avatar */}
      <AvatarOrb size={32} />

      {/* Bubble */}
      <div
        className="px-5 py-3.5"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "6px 14px 14px 14px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <InlineTypingIndicator />
      </div>
    </div>
  );
}
