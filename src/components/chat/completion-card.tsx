"use client";

interface CompletionCardProps {
  onRestart?: () => void;
}

export function CompletionCard({ onRestart }: CompletionCardProps) {
  return (
    <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-5">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
          Interview Complete
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 max-w-xs mx-auto">
          Thank you for sharing your experience! Your feedback will directly help improve the product.
        </p>
        {onRestart && (
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Start a new conversation
          </button>
        )}
      </div>
    </div>
  );
}
