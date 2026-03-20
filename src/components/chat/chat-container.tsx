"use client";

import { useEffect, useRef, useState } from "react";
import { useChat, type ChatMessage } from "@/hooks/use-chat";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { CompletionCard } from "./completion-card";

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
  const { messages, isLoading, isCompleted, error, sendMessage, loadHistory, submitCardInteraction } =
    useChat(sessionId);
  const [inputDisabled, setInputDisabled] = useState(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (initialMessages && initialMessages.length > 0) {
      loadHistory(initialMessages);
      return;
    }

    // No hardcoded welcome — let AI generate a personalized opening
    sendMessage("__START__");
  }, [initialMessages, loadHistory, sendMessage]);

  // Disable input when session is completed
  useEffect(() => {
    if (isCompleted) setInputDisabled(true);
  }, [isCompleted]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex-shrink-0 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight truncate">
              {surveyTitle}
            </p>
            {surveyDescription && (
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight mt-0.5 truncate">
                {surveyDescription}
              </p>
            )}
          </div>
          {onRestart && (
            <button
              onClick={onRestart}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex-shrink-0"
              title="Start a new conversation"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}
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
          isLoading={isLoading}
          onCardSubmit={submitCardInteraction}
        />
      </div>

      {/* Completion card or input */}
      {isCompleted ? (
        <CompletionCard onRestart={onRestart} />
      ) : (
        <MessageInput onSend={sendMessage} disabled={isLoading || inputDisabled} />
      )}
    </div>
  );
}
