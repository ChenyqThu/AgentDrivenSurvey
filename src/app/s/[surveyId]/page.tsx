"use client";

import { useEffect, useState, useMemo, use } from "react";
import { useSearchParams } from "next/navigation";
import { ChatContainer } from "@/components/chat/chat-container";
import { WelcomeScreen } from "@/components/chat/welcome-screen";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import type { ChatMessage } from "@/hooks/use-chat";

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
        body: JSON.stringify({ surveyId, respondentId }),
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

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Survey Unavailable</h1>
          <p className="text-sm text-gray-500">{loadError}</p>
        </div>
      </div>
    );
  }

  if (phase === "loading" || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <SpinnerIcon className="w-4 h-4 animate-spin" />
          Loading survey…
        </div>
      </div>
    );
  }

  if (survey.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Survey Not Available</h1>
          <p className="text-sm text-gray-500">
            This survey is currently <span className="font-medium">{survey.status}</span>.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "welcome") {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <WelcomeScreen
          title={survey.title}
          description={survey.description}
          onStart={handleStart}
        />
      </div>
    );
  }

  if (phase === "preparing") {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Same header as ChatContainer */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              A
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">
                {survey.title}
              </p>
            </div>
          </div>
        </div>
        {/* Typing indicator in the message area */}
        <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto pt-6">
          <TypingIndicator />
        </div>
      </div>
    );
  }

  // phase === "chat"
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ChatContainer
        key={sessionId}
        sessionId={sessionId!}
        surveyTitle={survey.title}
        surveyDescription={survey.description}
        initialMessages={initialMessages}
      />
    </div>
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
