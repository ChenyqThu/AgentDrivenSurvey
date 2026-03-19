"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface SessionRow {
  id: string;
  respondentId: string;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  extractedDataCount?: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  abandoned: "bg-gray-100 text-gray-600",
};

export default function ResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/surveys/${id}/responses`);
        if (!res.ok) throw new Error("Failed to load responses");
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : data.sessions ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function exportCSV() {
    const headers = [
      "Respondent ID",
      "Status",
      "Started At",
      "Completed At",
      "Extracted Fields",
    ];
    const rows = sessions.map((s) => [
      s.respondentId,
      s.status,
      s.startedAt ? new Date(s.startedAt).toISOString() : "",
      s.completedAt ? new Date(s.completedAt).toISOString() : "",
      String(s.extractedDataCount ?? 0),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    download("responses.csv", csv, "text/csv");
  }

  function exportJSON() {
    download(
      "responses.json",
      JSON.stringify(sessions, null, 2),
      "application/json"
    );
  }

  function download(filename: string, content: string, type: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = filename;
    a.click();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/admin/surveys/${id}`}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            &larr; Survey Detail
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Responses</h1>
          <p className="text-sm text-gray-500 mt-1">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={exportCSV}
            disabled={sessions.length === 0}
            className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={exportJSON}
            disabled={sessions.length === 0}
            className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Export JSON
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400">
            Loading responses…
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400">
            No responses yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">
                    Respondent ID
                  </th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-left font-medium">
                    Started At
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    Completed At
                  </th>
                  <th className="px-6 py-3 text-right font-medium">
                    Extracted Fields
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-700">
                      {session.respondentId}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_COLORS[session.status] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {session.startedAt
                        ? new Date(session.startedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {session.completedAt
                        ? new Date(session.completedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      {session.extractedDataCount ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
