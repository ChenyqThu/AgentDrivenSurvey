import Link from "next/link";
import { buttonClassName } from "@/components/ui/button-styles";

export default function Home() {
  return (
    <div
      className="flex flex-col flex-1 items-center justify-center min-h-screen"
      style={{ background: "var(--bg-chat)" }}
    >
      <main className="flex flex-col items-center text-center px-6 py-24 max-w-2xl mx-auto">
        <div
          className="mb-6 flex items-center justify-center w-16 h-16 rounded-[var(--radius-md)] text-2xl font-bold"
          style={{
            background: "var(--gradient-hero)",
            color: "var(--text-on-accent)",
            boxShadow: "var(--shadow-glow-blue)",
          }}
        >
          A
        </div>
        <h1
          className="text-4xl font-bold mb-4 tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Agent Driven Survey
        </h1>
        <p
          className="text-lg mb-10 leading-relaxed max-w-xl"
          style={{ color: "var(--text-secondary)" }}
        >
          A next-generation survey system powered by LLMs. Create intelligent,
          conversational surveys that adapt to respondents in real time and
          automatically extract structured insights.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/admin"
            className={buttonClassName("primary", "lg")}
            style={{ background: "var(--gradient-hero)" }}
          >
            Go to Admin Dashboard
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClassName("outline", "lg")}
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
              className="rounded-[var(--radius-md)] p-5 border transition-transform duration-150 hover:-translate-y-0.5"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3
                className="font-semibold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                {f.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
