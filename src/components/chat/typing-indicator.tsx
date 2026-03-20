"use client";

import { useState, useEffect } from "react";

const QUIRKY_PHRASES = [
  "Warming up the microphone...",
  "Brewing some coffee...",
  "Tidying up the desk...",
  "Stretching before the chat...",
  "Putting on my researcher hat...",
  "Sharpening my pencil...",
  "Reviewing my notes...",
  "Getting into the zone...",
  "Clearing my throat...",
  "Finding the right words...",
  "Thinking deeply...",
  "Connecting the dots...",
  "Dusting off the clipboard...",
  "Adjusting my glasses...",
  "Taking a deep breath...",
  "Polishing my questions...",
  "Tuning in carefully...",
  "Warming up the neurons...",
];

function pickRandom(): string {
  return QUIRKY_PHRASES[Math.floor(Math.random() * QUIRKY_PHRASES.length)];
}

/**
 * Inline typing indicator — renders INSIDE an AI message bubble
 * when content hasn't arrived yet.
 */
export function InlineTypingIndicator() {
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    setPhrase(pickRandom());
    const interval = setInterval(() => setPhrase(pickRandom()), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-blue-400" />
        </div>
        <span
          key={phrase}
          className="text-xs text-gray-400 dark:text-gray-500 italic phrase-fade"
        >
          {phrase}
        </span>
      </div>
      <style jsx>{`
        .typing-dot {
          animation: typingPulse 1.4s ease-in-out infinite;
        }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingPulse {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .phrase-fade {
          animation: fadeIn 0.4s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

/**
 * Standalone typing indicator — used in the "preparing" phase before chat starts.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 px-4 py-2">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm">
        AI
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-sm">
        <InlineTypingIndicator />
      </div>
    </div>
  );
}
