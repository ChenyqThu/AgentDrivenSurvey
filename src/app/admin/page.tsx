import Link from "next/link";
import { buttonClassName } from "@/components/ui/button-styles";
import { DashboardView } from "@/components/admin/dashboard-view";

interface SurveyRow {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  sessionCount?: number;
}

async function getSurveys(): Promise<SurveyRow[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/surveys`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function AdminDashboard() {
  const surveys = await getSurveys();

  const total = surveys.length;
  const active = surveys.filter((s) => s.status === "active").length;
  const draft = surveys.filter((s) => s.status === "draft").length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-[var(--type-display-size)] font-bold leading-[var(--type-display-line)] tracking-[var(--type-display-tracking)]"
            style={{ color: "var(--text-primary)" }}
          >
            Dashboard
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Overview of your surveys and activity
          </p>
        </div>
        <Link
          href="/admin/surveys/new"
          className={buttonClassName("primary", "md")}
          style={{ background: "var(--gradient-hero)" }}
        >
          <span className="text-lg leading-none">+</span>
          New Survey
        </Link>
      </div>

      <DashboardView
        surveys={surveys}
        total={total}
        active={active}
        draft={draft}
      />
    </div>
  );
}
