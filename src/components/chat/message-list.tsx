"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { messageAIVariants, messageUserVariants } from "@/lib/motion";
import { SimpleMarkdown } from "./simple-markdown";
import { InlineTypingIndicator } from "./typing-indicator";
import type { ChatMessage } from "@/hooks/use-chat";
import { InteractiveCard } from "./interactive-card";
import { AvatarOrb } from "./avatar-orb";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onCardSubmit?: (cardId: string, cardType: string, value: unknown) => void;
}

export function MessageList({ messages, isLoading, onCardSubmit }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // On initial load (history restore), jump instantly
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      container.scrollTop = container.scrollHeight;
      return;
    }

    // Only smooth-scroll if user is near the bottom (within 150px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center text-sm px-4"
        style={{ color: "var(--text-tertiary)" }}
        dir="auto"
      >
        对话内容将在此显示。
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="chat-scroll flex-1 overflow-y-auto px-3 sm:px-4 py-6" role="log" aria-live="polite">
      <AnimatePresence mode="popLayout">
      {messages.map((msg, idx) => {
        const isLastMsg = idx === messages.length - 1;
        const showTyping = isLoading && isLastMsg && msg.role === "assistant" && !msg.content;
        // Show a subtle loading hint when AI has text but is still processing (e.g., card loading)
        const showCardLoading = isLoading && isLastMsg && msg.role === "assistant" && !!msg.content;

        // Same role consecutive = 8px gap, role change = 20px gap
        const prevMsg = idx > 0 ? messages[idx - 1] : null;
        const isConsecutiveSameRole = prevMsg !== null && prevMsg.role === msg.role;
        const marginTop = idx === 0 ? 0 : isConsecutiveSameRole ? 8 : 20;

        // Only show avatar on the first message in an AI sequence
        const isFirstInAISequence =
          msg.role === "assistant" &&
          (prevMsg === null || prevMsg.role !== "assistant");

        return (
          <motion.div
            key={msg.id}
            variants={msg.role === "assistant" ? messageAIVariants : messageUserVariants}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            style={{ marginTop }}
          >
            <MessageBubble
              message={msg}
              showTypingIndicator={showTyping}
              showCardLoading={showCardLoading}
              onCardSubmit={onCardSubmit}
              showAvatar={isFirstInAISequence}
            />
          </motion.div>
        );
      })}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({
  message,
  showTypingIndicator,
  showCardLoading,
  onCardSubmit,
  showAvatar,
}: {
  message: ChatMessage;
  showTypingIndicator?: boolean;
  showCardLoading?: boolean;
  onCardSubmit?: (cardId: string, cardType: string, value: unknown) => void;
  showAvatar: boolean;
}) {
  const isUser = message.role === "user";
  const hasCards = !isUser && message.cards && message.cards.length > 0;

  return (
    <div className={`flex items-start gap-2 sm:gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* AI avatar — 32px gradient orb, shown only on first in sequence */}
      {!isUser && (
        <div className="w-8 flex-shrink-0 self-start mt-1">
          {showAvatar ? (
            <AvatarOrb size={32} />
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>
      )}

      <div
        className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%]`}
      >
        {/* Bubble */}
        {(message.content || !hasCards || showTypingIndicator) && (
          <div
            className={isUser ? "text-white" : ""}
            style={
              isUser
                ? {
                    background: "var(--accent-primary)",
                    borderRadius: "14px 14px 6px 14px",
                    padding: "14px 18px",
                    fontSize: "15px",
                    lineHeight: "1.625",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
                  }
                : {
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px 14px 14px 14px",
                    padding: "14px 18px",
                    fontSize: "15px",
                    lineHeight: "1.625",
                    boxShadow: "var(--shadow-sm)",
                  }
            }
          >
            {showTypingIndicator ? (
              <InlineTypingIndicator />
            ) : message.content ? (
              isUser ? (
                <p className="whitespace-pre-wrap break-words" dir="auto">
                  {message.content}
                </p>
              ) : (
                <SimpleMarkdown content={message.content} className="break-words" showCursor={showCardLoading && !hasCards} />
              )
            ) : (
              <span className="opacity-50 italic text-xs">&hellip;</span>
            )}
          </div>
        )}

        {/* Interactive cards wrapped in expand animation */}
        {hasCards &&
          message.cards!.map((card) => (
            <InteractiveCard
              key={card.id}
              card={card}
              onSubmit={(cardId, value) => onCardSubmit?.(cardId, card.type, value)}
            />
          ))}

        {/* Card loading hint — shows when AI has sent text but card hasn't arrived yet */}
        {showCardLoading && !hasCards && (
          <div className="mt-1 px-1 py-1 opacity-60">
            <InlineTypingIndicator />
          </div>
        )}
      </div>

      {/* User side spacer for alignment */}
      {isUser && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}
