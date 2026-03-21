"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { CardData } from "@/components/chat/interactive-card";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  cards?: CardData[];
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isCompleted: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  loadHistory: (messages: ChatMessage[]) => void;
  submitCardInteraction: (cardId: string, cardType: string, value: unknown) => Promise<void>;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const IDLE_TIMEOUT_MS = 60_000;  // 60 seconds
const MAX_NUDGES = 3;            // max 3 nudges per session

export function useChat(sessionId: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref for loading guard so sendMessage has stable identity
  const loadingRef = useRef(false);

  // Nudge mechanism refs
  const nudgeCountRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionCompletedRef = useRef(false);
  const userHasInteractedRef = useRef(false); // Only nudge after user has sent at least one real message
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const handleSessionCompleted = useCallback(() => {
    setIsCompleted(true);
    sessionCompletedRef.current = true;
    clearIdleTimer();
  }, [clearIdleTimer]);

  const sendNudge = useCallback(async () => {
    // Check if last AI message has unsubmitted interactive cards — don't nudge, user is interacting
    const lastMsg = messagesRef.current[messagesRef.current.length - 1];
    const hasPendingCard = lastMsg?.role === "assistant" && (lastMsg.cards?.length ?? 0) > 0;

    if (
      loadingRef.current ||
      nudgeCountRef.current >= MAX_NUDGES ||
      sessionCompletedRef.current ||
      !userHasInteractedRef.current || // Don't nudge before user has sent any message
      hasPendingCard // Don't nudge while user is looking at an interactive card
    ) return;

    nudgeCountRef.current++;
    loadingRef.current = true;
    setIsLoading(true);

    // Don't add a user message bubble for nudge
    const assistantId = generateId();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", cards: [] },
    ]);

    try {
      const res = await fetch(`/api/chat/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "__NUDGE__", isNudge: true }),
      });

      if (!res.ok) {
        // Silently fail nudge — not critical
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream")) {
        await consumeSSE(res, assistantId, setMessages, handleSessionCompleted);
      }
    } catch {
      // Silently fail nudge
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [sessionId, handleSessionCompleted]);

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();
    if (nudgeCountRef.current >= MAX_NUDGES || sessionCompletedRef.current) return;

    idleTimerRef.current = setTimeout(() => {
      sendNudge();
    }, IDLE_TIMEOUT_MS);
  }, [clearIdleTimer, sendNudge]);

  // Visibility change: pause/resume idle timer
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        clearIdleTimer();
      } else if (!loadingRef.current && nudgeCountRef.current < MAX_NUDGES) {
        startIdleTimer();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearIdleTimer();
    };
  }, [clearIdleTimer, startIdleTimer]);

  const loadHistory = useCallback((history: ChatMessage[]) => {
    setMessages(history);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || loadingRef.current) return;

      // User activity: clear idle timer, reset nudge count
      clearIdleTimer();

      const isAutoStart = content.trim() === "__START__";

      // Mark user as having interacted (enables nudge mechanism)
      if (!isAutoStart) {
        userHasInteractedRef.current = true;
      }

      // Don't show __START__ as a user message bubble
      if (!isAutoStart) {
        const userMessage: ChatMessage = {
          id: generateId(),
          role: "user",
          content: content.trim(),
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);
      }

      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Placeholder for the streaming assistant message
      const assistantId = generateId();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", cards: [] },
      ]);

      try {
        const res = await fetch(`/api/chat/${sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content.trim() }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        const contentType = res.headers.get("content-type") ?? "";

        if (contentType.includes("text/event-stream")) {
          await consumeSSE(res, assistantId, setMessages, handleSessionCompleted);
        } else {
          const data = await res.json();
          const text =
            data.message ??
            data.content ??
            data.response ??
            JSON.stringify(data);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: text } : m
            )
          );
        }

        // Start idle timer after AI response completes
        startIdleTimer();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [sessionId, clearIdleTimer, startIdleTimer, handleSessionCompleted]
  );

  const submitCardInteraction = useCallback(
    async (cardId: string, cardType: string, value: unknown) => {
      if (loadingRef.current) return;

      // User activity: clear idle timer + mark as interacted
      clearIdleTimer();
      userHasInteractedRef.current = true;

      const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
      const interactionMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: displayValue,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, interactionMessage]);

      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      const assistantId = generateId();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", cards: [] },
      ]);

      try {
        const res = await fetch(`/api/chat/${sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: JSON.stringify({ type: "card_interaction", cardId, cardType, value }),
            isCardInteraction: true,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        const contentType = res.headers.get("content-type") ?? "";

        if (contentType.includes("text/event-stream")) {
          await consumeSSE(res, assistantId, setMessages, handleSessionCompleted);
        } else {
          const data = await res.json();
          const text =
            data.message ??
            data.content ??
            data.response ??
            JSON.stringify(data);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: text } : m
            )
          );
        }

        // Start idle timer after AI response completes
        startIdleTimer();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [sessionId, clearIdleTimer, startIdleTimer, handleSessionCompleted]
  );

  return { messages, isLoading, isCompleted, error, sendMessage, loadHistory, submitCardInteraction };
}

// ─── SSE consumer ─────────────────────────────────────────────────────────────

async function consumeSSE(
  res: Response,
  assistantId: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  onCompleted?: () => void,
) {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingCards: CardData[] = [];
  let displayedText = "";
  const FLUSH_INTERVAL = 30; // ms — smooth character reveal

  // Flush accumulated text + cards to React state with throttle
  function scheduleFlush() {
    if (flushTimer !== null) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      // Reveal text progressively — show up to 8 more chars per tick for smoothness
      const target = accumulated;
      if (displayedText.length < target.length) {
        const charsToAdd = Math.min(8, target.length - displayedText.length);
        displayedText = target.slice(0, displayedText.length + charsToAdd);
        // Schedule next tick if more text to reveal
        if (displayedText.length < target.length) {
          scheduleFlush();
        }
      } else {
        displayedText = target;
      }

      const currentText = displayedText;
      const currentCards = pendingCards.length > 0 ? [...pendingCards] : null;
      if (currentCards) pendingCards = [];

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: currentText,
                ...(currentCards ? { cards: [...(m.cards ?? []), ...currentCards] } : {}),
              }
            : m
        )
      );
    }, FLUSH_INTERVAL);
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === "[DONE]") continue;

        try {
          const event = JSON.parse(raw);

          if (event.type === "session_completed") {
            onCompleted?.();
          }

          if (event.type === "done") {
            break;
          }

          if (event.type === "text" && typeof event.content === "string") {
            accumulated += event.content;
            scheduleFlush();
          }

          if (
            event.type === "content_block_delta" &&
            event.delta?.type === "text_delta"
          ) {
            accumulated += event.delta.text ?? "";
            scheduleFlush();
          }

          if (event.type === "interactive_card" && event.card) {
            pendingCards.push(event.card as CardData);
            scheduleFlush();
          }
        } catch {
          // non-JSON line, skip
        }
      }
    }
  } finally {
    // Final flush — show all remaining text immediately
    if (flushTimer !== null) clearTimeout(flushTimer);
    const finalText = accumulated;
    const finalCards = pendingCards.length > 0 ? [...pendingCards] : null;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? {
              ...m,
              content: finalText,
              ...(finalCards ? { cards: [...(m.cards ?? []), ...finalCards] } : {}),
            }
          : m
      )
    );
  }
}
