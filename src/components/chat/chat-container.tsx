"use client";

import { useEffect, useRef } from "react";
import { useChat, type ChatMessage } from "@/hooks/use-chat";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";

interface ChatContainerProps {
  sessionId: string;
  surveyTitle: string;
  surveyDescription?: string | null;
  initialMessages?: ChatMessage[];
  autoStart?: boolean;
}

export function ChatContainer({
  sessionId,
  surveyTitle,
  surveyDescription,
  initialMessages,
  autoStart,
}: ChatContainerProps) {
  const { messages, isLoading, error, sendMessage, loadHistory, submitCardInteraction } =
    useChat(sessionId);
  const autoTriggered = useRef(false);

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      loadHistory(initialMessages);
    }
  }, [initialMessages, loadHistory]);

  // Auto-trigger streaming AI greeting for new sessions
  useEffect(() => {
    if (!autoStart || autoTriggered.current) return;
    autoTriggered.current = true;
    // Small delay to ensure component is mounted
    const timer = setTimeout(() => sendMessage("__START__"), 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">
              {surveyTitle}
            </p>
            {surveyDescription && (
              <p className="text-xs text-gray-400 leading-tight mt-0.5">
                {surveyDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 bg-red-50 border-b border-red-200 text-red-700 text-xs px-4 py-2 text-center">
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
