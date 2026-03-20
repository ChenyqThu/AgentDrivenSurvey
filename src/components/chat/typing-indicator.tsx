"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 px-4 py-2">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm">
        AI
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot w-2 h-2 rounded-full bg-blue-400" />
          <span className="typing-dot w-2 h-2 rounded-full bg-blue-400" />
          <span className="typing-dot w-2 h-2 rounded-full bg-blue-400" />
        </div>
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
      `}</style>
    </div>
  );
}
