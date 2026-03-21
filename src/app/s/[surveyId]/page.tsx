"use client";

import { useEffect, useState, useMemo, useCallback, use } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { ChatContainer } from "@/components/chat/chat-container";
import { WelcomeScreen } from "@/components/chat/welcome-screen";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import type { ChatMessage } from "@/hooks/use-chat";
import { springs, durations } from "@/lib/motion";
import { AvatarOrb } from "@/components/chat/avatar-orb";

interface SurveyInfo {
  id: string;
  title: string;
  description?: string | null;
  status: string;
}

const SESSION_KEY_PREFIX = "survey_session_";

export default function SurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = use(params);
  const searchParams = useSearchParams();
  const respondentId = useMemo(
    () => searchParams.get("uid") ?? generateRespondentId(),
    [searchParams]
  );

  // Parse imported respondent profile from URL: ?profile=<base64json>
  const respondentInfo = useMemo(() => {
    const profileParam = searchParams.get("profile");
    if (!profileParam) return undefined;
    try {
      const decoded = atob(profileParam);
      const parsed = JSON.parse(decoded);
      return typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : undefined;
    } catch {
      console.warn("Failed to decode profile parameter");
      return undefined;
    }
  }, [searchParams]);

  const [survey, setSurvey] = useState<SurveyInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<"loading" | "welcome" | "preparing" | "chat">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load survey info
  useEffect(() => {
    async function loadSurvey() {
      try {
        const res = await fetch(`/api/surveys/${surveyId}`);
        if (!res.ok) throw new Error("Survey not found");
        const data: SurveyInfo = await res.json();
        setSurvey(data);
        setPhase("welcome");
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load survey");
      }
    }
    loadSurvey();
  }, [surveyId]);

  // Restart: create a brand new session
  const handleRestart = useCallback(async () => {
    const storageKey = `${SESSION_KEY_PREFIX}${surveyId}_${respondentId}`;
    localStorage.removeItem(storageKey);
    setSessionId(null);
    setInitialMessages([]);
    setPhase("preparing");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyId, respondentId, respondentInfo }),
      });

      if (!res.ok) {
        throw new Error("Failed to create new session");
      }

      const { id: newSessionId } = await res.json();
      localStorage.setItem(storageKey, newSessionId);
      setSessionId(newSessionId);
      setPhase("chat");
    } catch (err) {
      console.error("Failed to restart survey:", err);
      setLoadError(err instanceof Error ? err.message : "Failed to restart");
      setPhase("welcome");
    }
  }, [surveyId, respondentId, respondentInfo]);

  async function handleStart() {
    setLoadError(null);
    setPhase("preparing");

    try {
      const storageKey = `${SESSION_KEY_PREFIX}${surveyId}_${respondentId}`;
      // Clean up old format key
      const oldKey = `${SESSION_KEY_PREFIX}${surveyId}`;
      if (localStorage.getItem(oldKey)) localStorage.removeItem(oldKey);

      // ?new=1 forces a fresh session (for testing)
      const forceNew = searchParams.get("new") === "1";
      const existingSessionId = forceNew ? null : localStorage.getItem(storageKey);

      if (existingSessionId) {
        const res = await fetch(`/api/sessions/${existingSessionId}`);
        if (res.ok) {
          const data = await res.json();
          const history: ChatMessage[] = (data.messages ?? []).map(
            (m: { id: string; role: string; content: string; createdAt?: string }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              createdAt: m.createdAt,
            })
          );

          if (history.length > 0) {
            setSessionId(existingSessionId);
            setInitialMessages(history);
            setPhase("chat");
            return;
          }

          localStorage.setItem(storageKey, existingSessionId);
          setSessionId(existingSessionId);
          setInitialMessages([]);
          setPhase("chat");
          return;
        }
        localStorage.removeItem(storageKey);
      }

      // Create new session
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyId, respondentId, respondentInfo }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to start session");
      }

      const { id: newSessionId } = await res.json();
      localStorage.setItem(storageKey, newSessionId);
      setSessionId(newSessionId);
      setInitialMessages([]);
      setPhase("chat");
    } catch (err) {
      console.error("Failed to start survey:", err);
      setLoadError(err instanceof Error ? err.message : "Failed to start survey");
      setPhase("welcome");
    }
  }

  // ── Error state ──
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center chat-bg px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durations.slow }}
          className="text-center max-w-sm"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "var(--accent-danger-soft)" }}
          >
            <svg className="w-7 h-7" style={{ color: "var(--accent-danger)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Survey Unavailable</h1>
          <p className="text-[14px] text-[var(--text-secondary)]">{loadError}</p>
        </motion.div>
      </div>
    );
  }

  // ── Loading state ──
  if (phase === "loading" || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center chat-bg">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-[var(--text-tertiary)] text-[14px]"
        >
          <SpinnerIcon className="w-5 h-5 animate-spin" />
          Loading survey…
        </motion.div>
      </div>
    );
  }

  // ── Inactive survey ──
  if (survey.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center chat-bg px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durations.slow }}
          className="text-center max-w-sm"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "var(--accent-warm-soft)" }}
          >
            <svg className="w-7 h-7" style={{ color: "var(--accent-warm)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Survey Not Available</h1>
          <p className="text-[14px] text-[var(--text-secondary)]">
            This survey is currently <span className="font-medium">{survey.status}</span>.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex flex-col h-screen chat-bg">
      <AnimatePresence mode="wait">
        {phase === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: durations.normal }}
            className="flex-1 flex flex-col"
          >
            <WelcomeScreen
              title={survey.title}
              description={survey.description}
              onStart={handleStart}
            />
          </motion.div>
        )}

        {phase === "preparing" && (
          <motion.div
            key="preparing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durations.normal }}
            className="flex-1 flex flex-col"
          >
            {/* Header matching chat style */}
            <div
              className="flex-shrink-0 glass border-b px-4 py-3 z-10"
              style={{
                background: "var(--bg-overlay)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="max-w-3xl mx-auto flex items-center gap-3">
                <AvatarOrb size={36} />
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-[14px] leading-tight">
                    {survey.title}
                  </p>
                </div>
              </div>
            </div>
            {/* Typing indicator in the message area */}
            <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto pt-6">
              <TypingIndicator />
            </div>
          </motion.div>
        )}

        {phase === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, duration: durations.normal }}
            className="flex-1 flex flex-col min-h-0"
          >
            <ChatContainer
              key={sessionId}
              sessionId={sessionId!}
              surveyTitle={survey.title}
              surveyDescription={survey.description}
              initialMessages={initialMessages}
              onRestart={handleRestart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
}

function generateRespondentId(): string {
  return `anon_${Math.random().toString(36).slice(2, 10)}`;
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
