"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SkeletonRow } from "@/components/ui/skeleton";
import { fadeUpVariants, staggerContainer, stagger, springs } from "@/lib/motion";

interface SessionRow {
  id: string;
  respondentId: string;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  extractedDataCount?: number;
}

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
            className="text-sm flex items-center gap-1 mb-2 transition-colors duration-150 hover:text-[var(--text-primary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            &larr; Survey Detail
          </Link>
          <h1
            className="text-[var(--type-display-size)] font-bold leading-[var(--type-display-line)] tracking-[var(--type-display-tracking)]"
            style={{ color: "var(--text-primary)" }}
          >
            Responses
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={exportCSV}
            disabled={sessions.length === 0}
            variant="outline"
            size="sm"
          >
            Export CSV
          </Button>
          <Button
            onClick={exportJSON}
            disabled={sessions.length === 0}
            variant="outline"
            size="sm"
          >
            Export JSON
          </Button>
        </div>
      </div>

      {error && (
        <div
          className="mb-5 border text-sm rounded-[var(--radius-sm)] px-4 py-3"
          style={{
            background: "var(--accent-danger-soft)",
            borderColor:
              "color-mix(in srgb, var(--accent-danger) 25%, transparent)",
            color: "var(--accent-danger)",
          }}
        >
          {error}
        </div>
      )}

      <div
        className="rounded-[var(--radius-md)] border overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead
                className="text-[11px] uppercase tracking-wider"
                style={{
                  background: "var(--bg-surface-raised)",
                  color: "var(--text-tertiary)",
                }}
              >
                <tr>
                  <th className="px-6 py-3 text-left font-medium">
                    Respondent ID
                  </th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-left font-medium">Started</th>
                  <th className="px-6 py-3 text-left font-medium">Completed</th>
                  <th className="px-6 py-3 text-right font-medium">Fields</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} columns={5} />
                ))}
              </tbody>
            </table>
          </div>
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springs.gentle, delay: 0.1 }}
            className="px-6 py-16 text-center flex flex-col items-center gap-4"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "var(--accent-warm-soft)",
                color: "var(--accent-warm)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                No responses yet
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Share the survey link to start collecting interviews.
              </p>
            </div>
            <Link
              href={`/admin/surveys/${id}`}
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline mt-1"
              style={{ color: "var(--accent-primary)" }}
            >
              &larr; Back to survey
            </Link>
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead
                className="text-[11px] uppercase tracking-wider"
                style={{
                  background: "var(--bg-surface-raised)",
                  color: "var(--text-tertiary)",
                }}
              >
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
              <motion.tbody
                initial="initial"
                animate="animate"
                variants={staggerContainer(stagger.fast)}
              >
                {sessions.map((session, i) => (
                  <motion.tr
                    key={session.id}
                    variants={fadeUpVariants}
                    whileHover={{ backgroundColor: "var(--bg-surface-raised)" }}
                    transition={{ duration: 0.15 }}
                    style={{
                      borderTop:
                        i === 0 ? "none" : "1px solid var(--border-subtle)",
                    }}
                  >
                    <td
                      className="px-6 py-4 font-mono text-xs"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {session.respondentId}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={session.status} size="sm" />
                    </td>
                    <td
                      className="px-6 py-4 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {session.startedAt
                        ? new Date(session.startedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td
                      className="px-6 py-4 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {session.completedAt
                        ? new Date(session.completedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {session.extractedDataCount ?? 0}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
