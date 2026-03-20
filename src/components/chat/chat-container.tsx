"use client";

import { useEffect, useRef } from "react";
import { useChat, type ChatMessage } from "@/hooks/use-chat";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: [
    "Hi there! I'm **Ann** from the Omada product team. 👋",
    "",
    "Thanks for joining this quick chat about your experience with the **Omada App**. It takes about 10–15 minutes — just an easy conversation, no right or wrong answers.",
    "",
    "Everything you share is confidential and only used to improve the product. Feel free to skip anything or stop at any time.",
    "",
    "🌍 Prefer another language? Just let me know — I can switch to Chinese, Japanese, or others anytime.",
    "",
    "**Send any message when you're ready, and we'll get started!**",
  ].join("\n"),
  createdAt: new Date().toISOString(),
};

interface ChatContainerProps {
  sessionId: string;
  surveyTitle: string;
  surveyDescription?: string | null;
  initialMessages?: ChatMessage[];
}

export function ChatContainer({
  sessionId,
  surveyTitle,
  surveyDescription,
  initialMessages,
}: ChatContainerProps) {
  const initializedRef = useRef(false);
  const { messages, isLoading, error, sendMessage, loadHistory, submitCardInteraction } =
    useChat(sessionId);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (initialMessages && initialMessages.length > 0) {
      loadHistory(initialMessages);
      return;
    }

    // Show fixed welcome message immediately — no AI call needed
    loadHistory([WELCOME_MESSAGE]);
  }, [initialMessages, loadHistory]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            O
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight truncate">
              {surveyTitle}
            </p>
            {surveyDescription && (
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight mt-0.5 truncate">
                {surveyDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs px-4 py-2 text-center">
          {error} — please try again.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-3xl w-full mx-auto">
        <MessageList
          messages={messages}
          onCardSubmit={submitCardInteraction}
        />
        {isLoading && <TypingIndicator />}
      </div>

      {/* Input */}
      <MessageInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
