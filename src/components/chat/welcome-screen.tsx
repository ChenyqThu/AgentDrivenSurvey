"use client";

interface WelcomeScreenProps {
  title: string;
  description?: string | null;
  onStart: () => void;
}

export function WelcomeScreen({ title, description, onStart }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center w-full max-w-md">
        {/* Warm chat icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30 mb-8">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-snug">
          {title}
        </h1>

        {/* Description */}
        {description ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            {description}
          </p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            We&apos;d love to hear about your experience in a quick, friendly conversation.
            Your honest thoughts help us build something better.
          </p>
        )}

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-4 mb-8 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            10–15 min
          </span>
          <span className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Confidential
          </span>
          <span className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            No wrong answers
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md shadow-blue-200 dark:shadow-blue-900/30 hover:bg-blue-700 active:scale-[0.97] transition-all min-h-[48px] text-base"
        >
          Start the Conversation
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-5">
          Skip any question or stop anytime — no pressure at all.
        </p>
      </div>
    </div>
  );
}
