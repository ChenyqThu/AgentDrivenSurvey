import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gray-50 min-h-screen">
      <main className="flex flex-col items-center text-center px-6 py-24 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-bold shadow-lg">
          A
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
          Agent Driven Survey
        </h1>
        <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-xl">
          A next-generation survey system powered by LLMs. Create intelligent,
          conversational surveys that adapt to respondents in real time and
          automatically extract structured insights.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold text-sm shadow hover:bg-blue-700 transition-colors"
          >
            Go to Admin Dashboard
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            View on GitHub
          </a>
        </div>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full">
          {[
            {
              icon: "🤖",
              title: "AI-Powered",
              desc: "Claude generates adaptive follow-up questions based on respondent answers.",
            },
            {
              icon: "📊",
              title: "Structured Extraction",
              desc: "Automatically extracts key data points from free-form conversation.",
            },
            {
              icon: "⚡",
              title: "Real-time Streaming",
              desc: "Responses stream live so surveys feel fast and natural.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
