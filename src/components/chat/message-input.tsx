"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion } from "motion/react";
import { ArrowUp } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  // Auto-focus when input becomes enabled (AI finished responding)
  const prevDisabledRef = useRef(disabled);
  useEffect(() => {
    if (prevDisabledRef.current && !disabled) {
      textareaRef.current?.focus();
    }
    prevDisabledRef.current = disabled;
  }, [disabled]);

  const hasContent = value.trim().length > 0;
  const isDisabled = disabled || !hasContent;

  return (
    <div className="safe-area-bottom px-3 sm:px-4 py-3">
      <div
        className="max-w-3xl mx-auto flex items-end gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[28px] shadow-[var(--shadow-sm)] px-4 py-2 transition-all duration-200 focus-within:border-[var(--accent-primary)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)]"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          placeholder={disabled ? "等待回复中…" : "输入你的回答…"}
          dir="auto"
          rows={1}
          className="flex-1 min-w-0 resize-none border-none bg-transparent outline-none text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] px-1 leading-normal overflow-hidden disabled:opacity-50 flex items-center"
          style={{ minHeight: "40px", maxHeight: "160px", paddingTop: "10px", paddingBottom: "10px", transition: "height 0.12s ease-out" }}
        />

        <motion.button
          onClick={handleSend}
          disabled={isDisabled}
          whileTap={isDisabled ? {} : { scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          aria-label="发送消息"
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mb-0.5 cursor-pointer disabled:cursor-not-allowed relative overflow-hidden"
        >
          {/* Base layer - always visible */}
          <div
            className="absolute inset-0 rounded-full transition-opacity duration-200"
            style={{
              background: "var(--bg-surface-raised)",
              opacity: hasContent && !disabled ? 0 : 1,
            }}
          />
          {/* Gradient layer - fades in when has content */}
          <div
            className="absolute inset-0 rounded-full transition-opacity duration-200"
            style={{
              background: "var(--gradient-hero)",
              opacity: hasContent && !disabled ? 1 : 0,
            }}
          />
          {/* Icon */}
          <ArrowUp
            size={18}
            className="relative z-10 transition-opacity duration-200"
            style={{
              color: hasContent && !disabled ? "white" : "var(--text-tertiary)",
            }}
            strokeWidth={2.5}
          />
        </motion.button>
      </div>
    </div>
  );
}
