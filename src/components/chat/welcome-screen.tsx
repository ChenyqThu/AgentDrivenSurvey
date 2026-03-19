"use client";

interface WelcomeScreenProps {
  title: string;
  description?: string | null;
  onStart: () => void;
}

export function WelcomeScreen({ title, description, onStart }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-bold shadow-lg mb-6">
          A
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>
        {description && (
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            {description}
          </p>
        )}
        {!description && (
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            This survey is conducted as a conversation. Answer naturally —
            the AI interviewer will guide you through the questions.
          </p>
        )}
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow hover:bg-blue-700 active:scale-95 transition-all"
        >
          Start Survey
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
        <p className="text-xs text-gray-400 mt-4">
          Takes approximately 5–10 minutes
        </p>
      </div>
    </div>
  );
}
