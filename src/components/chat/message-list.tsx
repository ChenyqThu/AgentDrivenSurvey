"use client";

import { useEffect, useRef } from "react";
import { SimpleMarkdown } from "./simple-markdown";
import type { ChatMessage } from "@/hooks/use-chat";
import { InteractiveCard } from "./interactive-card";

interface MessageListProps {
  messages: ChatMessage[];
  onCardSubmit?: (cardId: string, cardType: string, value: unknown) => void;
}

export function MessageList({ messages, onCardSubmit }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500 px-4" dir="auto">
        对话内容将在此显示。
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-6 space-y-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} onCardSubmit={onCardSubmit} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({
  message,
  onCardSubmit,
}: {
  message: ChatMessage;
  onCardSubmit?: (cardId: string, cardType: string, value: unknown) => void;
}) {
  const isUser = message.role === "user";
  const hasCards = !isUser && message.cards && message.cards.length > 0;

  return (
    <div className={`flex items-end gap-2 sm:gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm self-start mt-1">
          AI
        </div>
      )}

      <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%]`}>
        {/* Bubble — only show if there is text content */}
        {(message.content || !hasCards) && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              isUser
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm"
            }`}
          >
            {message.content ? (
              isUser ? (
                <p className="whitespace-pre-wrap break-words" dir="auto">{message.content}</p>
              ) : (
                <SimpleMarkdown content={message.content} className="break-words" />
              )
            ) : (
              <span className="opacity-50 italic text-xs">…</span>
            )}
          </div>
        )}

        {/* Interactive cards */}
        {hasCards &&
          message.cards!.map((card) => (
            <InteractiveCard
              key={card.id}
              card={card}
              onSubmit={(cardId, value) =>
                onCardSubmit?.(cardId, card.type, value)
              }
            />
          ))}
      </div>

      {/* User avatar placeholder for alignment */}
      {isUser && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}
