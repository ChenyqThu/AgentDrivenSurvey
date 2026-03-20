"use client";

import { useEffect, useRef } from "react";
import { MarkdownHooks as ReactMarkdown } from "react-markdown";
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
                <div className="markdown-content break-words" dir="auto">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      h1: ({ children }) => <h1 className="text-base font-bold mb-1 mt-2 first:mt-0">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5 pl-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5 pl-1">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      code: ({ children, className }) => {
                        const isBlock = className?.includes("language-");
                        return isBlock ? (
                          <code className="block bg-gray-100 dark:bg-gray-900 rounded px-3 py-2 text-xs font-mono my-2 overflow-x-auto whitespace-pre">
                            {children}
                          </code>
                        ) : (
                          <code className="bg-gray-100 dark:bg-gray-900 rounded px-1 py-0.5 text-xs font-mono">
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => <pre className="my-2">{children}</pre>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          {children}
                        </a>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-gray-300 dark:border-gray-600 pl-3 italic text-gray-600 dark:text-gray-400 my-2">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
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
