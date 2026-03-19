"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { ChatContainer } from "@/components/chat/chat-container";
import { WelcomeScreen } from "@/components/chat/welcome-screen";
import type { ChatMessage } from "@/hooks/use-chat";

interface SurveyInfo {
  id: string;
  title: string;
  description?: string | null;
  status: string;
}

interface SessionInfo {
  id: string;
  messages?: ChatMessage[];
}

const SESSION_KEY_PREFIX = "survey_session_";

export default function SurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = use(params);
  const searchParams = useSearchParams();
  const respondentId = searchParams.get("uid") ?? generateRespondentId();

  const [survey, setSurvey] = useState<SurveyInfo | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [started, setStarted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  // Load survey info
  useEffect(() => {
    async function loadSurvey() {
      try {
        const res = await fetch(`/api/surveys/${surveyId}`);
        if (!res.ok) throw new Error("Survey not found");
        const data: SurveyInfo = await res.json();
        setSurvey(data);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load survey");
      }
    }
    loadSurvey();
  }, [surveyId]);

  async function handleStart() {
    setInitializing(true);
    try {
      // Check for existing session in localStorage
      const storageKey = `${SESSION_KEY_PREFIX}${surveyId}`;
      const existingSessionId = localStorage.getItem(storageKey);

      if (existingSessionId) {
        // Try to resume existing session
        const res = await fetch(`/api/sessions/${existingSessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSession({ id: existingSessionId, messages: data.messages ?? [] });
          setStarted(true);
          return;
        }
        // Session expired or invalid, remove it
        localStorage.removeItem(storageKey);
      }

      // Create a new session
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyId, respondentId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to start session");
      }

      const data: SessionInfo = await res.json();
      localStorage.setItem(storageKey, data.id);
      setSession({ id: data.id, messages: data.messages ?? [] });
      setStarted(true);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to start survey");
    } finally {
      setInitializing(false);
    }
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Survey Unavailable
          </h1>
          <p className="text-sm text-gray-500">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!survey) {
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
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Survey Not Available
          </h1>
          <p className="text-sm text-gray-500">
            This survey is currently{" "}
            <span className="font-medium">{survey.status}</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {!started || !session ? (
        <div className="flex flex-col flex-1">
          <WelcomeScreen
            title={survey.title}
            description={survey.description}
            onStart={handleStart}
          />
          {initializing && (
            <div className="text-center pb-6 text-sm text-gray-400 flex items-center justify-center gap-2">
              <SpinnerIcon className="w-4 h-4 animate-spin" />
              Starting session…
            </div>
          )}
        </div>
      ) : (
        <ChatContainer
          sessionId={session.id}
          surveyTitle={survey.title}
          surveyDescription={survey.description}
          initialMessages={session.messages}
        />
      )}
    </div>
  );
}

function generateRespondentId(): string {
  return `anon_${Math.random().toString(36).slice(2, 10)}`;
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
