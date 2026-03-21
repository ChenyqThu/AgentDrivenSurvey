"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw } from "lucide-react";
import { AvatarOrb } from "./avatar-orb";
import { useChat, type ChatMessage } from "@/hooks/use-chat";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { CompletionCard } from "./completion-card";
import { ConfettiBurst } from "./confetti";

interface ChatContainerProps {
  sessionId: string;
  surveyTitle: string;
  surveyDescription?: string | null;
  initialMessages?: ChatMessage[];
  onRestart?: () => void;
}

export function ChatContainer({
  sessionId,
  surveyTitle,
  surveyDescription,
  initialMessages,
  onRestart,
}: ChatContainerProps) {
  const initializedRef = useRef(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const { messages, isLoading, isCompleted, error, sendMessage, loadHistory, submitCardInteraction } =
    useChat(sessionId);

  useEffect(() => {
    if (!confirmRestart) return;
    const timer = setTimeout(() => setConfirmRestart(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmRestart]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (initialMessages && initialMessages.length > 0) {
      loadHistory(initialMessages);
      return;
    }

    // No hardcoded welcome — let AI generate a personalized opening
    // Check if already started (prevents double-fire from React StrictMode or remount)
    const startKey = `survey_started_${sessionId}`;
    if (sessionStorage.getItem(startKey)) return;
    sessionStorage.setItem(startKey, "1");
    sendMessage("__START__");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="chat-bg flex flex-col h-full">
      <ConfettiBurst trigger={isCompleted} />
      {/* Header */}
      <motion.div
        className="glass flex-shrink-0 sticky top-0 z-10 bg-[var(--bg-overlay)] px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
        initial={{ y: -48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {/* AI avatar orb */}
          <AvatarOrb size={36} />

          {/* Survey title + description */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-[var(--text-primary)] text-sm leading-tight truncate">
                {surveyTitle}
              </p>
              <span
                className="flex-shrink-0 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-[4px]"
                style={{
                  background: "var(--accent-primary-soft)",
                  color: "var(--accent-primary)",
                }}
              >
                Alpha
              </span>
            </div>
            {surveyDescription && (
              <p className="text-xs text-[var(--text-tertiary)] leading-tight mt-0.5 truncate">
                {surveyDescription}
              </p>
            )}
          </div>

          {/* Restart button */}
          {onRestart && (
            <div className="flex-shrink-0">
              {confirmRestart ? (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-1"
                >
                  <button
                    onClick={() => { setConfirmRestart(false); onRestart(); }}
                    className="text-xs font-medium px-2 py-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--accent-danger)", background: "var(--accent-danger-soft)" }}
                  >
                    Restart
                  </button>
                  <button
                    onClick={() => setConfirmRestart(false)}
                    className="text-xs px-2 py-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Cancel
                  </button>
                </motion.div>
              ) : (
                <button
                  onClick={() => setConfirmRestart(true)}
                  className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors px-2 py-1.5 rounded-lg hover:bg-[var(--accent-primary-soft)] flex-shrink-0"
                  title="Start a new conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Subtle progress indicator */}
      <div className="h-[2px] w-full flex-shrink-0" style={{ background: "var(--bg-surface-raised)" }}>
        <motion.div
          className="h-full"
          style={{ background: "var(--gradient-hero)" }}
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(100, (messages.length / 30) * 100)}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] as const }}
        />
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error-banner"
            className="flex-shrink-0 text-xs px-4 py-2 text-center bg-[var(--accent-danger-soft)] text-[var(--accent-danger)]"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              height: { duration: 0.25, ease: "easeOut" },
              opacity: { duration: 0.2, delay: 0.1 },
            }}
          >
            {error} — please try again.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-3xl w-full mx-auto">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onCardSubmit={submitCardInteraction}
        />
      </div>

      {/* Footer: glassmorphism treatment matching header */}
      <div
        className="glass flex-shrink-0 bg-[var(--bg-overlay)] safe-area-bottom"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.div
              key="completion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] as const }}
            >
              <CompletionCard onRestart={onRestart} />
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1.0] as const }}
            >
              <MessageInput onSend={sendMessage} disabled={isLoading || isCompleted} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
