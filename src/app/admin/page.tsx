import Link from "next/link";

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

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  paused: "bg-orange-100 text-orange-800",
  closed: "bg-gray-100 text-gray-600",
};

export default async function AdminDashboard() {
  const surveys = await getSurveys();

  const total = surveys.length;
  const active = surveys.filter((s) => s.status === "active").length;
  const draft = surveys.filter((s) => s.status === "draft").length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your surveys and activity
          </p>
        </div>
        <Link
          href="/admin/surveys/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <span className="text-lg leading-none">+</span> New Survey
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Surveys" value={total} color="blue" />
        <StatCard label="Active Surveys" value={active} color="green" />
        <StatCard label="Drafts" value={draft} color="yellow" />
      </div>

      {/* Survey list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Surveys</h2>
          <Link
            href="/admin/surveys"
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {surveys.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-gray-400 text-sm mb-4">No surveys yet.</p>
            <Link
              href="/admin/surveys/new"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
            >
              Create your first survey &rarr;
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Title</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-left font-medium">Created</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {surveys.slice(0, 10).map((survey) => (
                <tr key={survey.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {survey.title}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        STATUS_COLORS[survey.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {survey.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {survey.createdAt
                      ? new Date(survey.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/surveys/${survey.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "yellow";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
  };
  return (
    <div
      className={`rounded-xl border p-5 ${colorMap[color]} flex flex-col gap-1`}
    >
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-sm font-medium opacity-80">{label}</span>
    </div>
  );
}
