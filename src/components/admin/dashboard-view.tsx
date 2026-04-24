"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  fadeUpVariants,
  staggerContainer,
  springs,
  stagger,
} from "@/lib/motion";
import { StatusBadge } from "@/components/ui/status-badge";
import { CountUp } from "@/components/ui/animated-text";

interface SurveyRow {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  sessionCount?: number;
}

interface DashboardViewProps {
  surveys: SurveyRow[];
  total: number;
  active: number;
  draft: number;
}

export function DashboardView({ surveys, total, active, draft }: DashboardViewProps) {
  return (
    <>
      {/* Stats grid */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer(stagger.normal)}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        <StatCard label="Total Surveys" value={total} tone="info" />
        <StatCard label="Active Surveys" value={active} tone="success" />
        <StatCard label="Drafts" value={draft} tone="warning" />
      </motion.div>

      {/* Survey list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.gentle, delay: 0.15 }}
        className="rounded-[var(--radius-md)] border overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h2
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            Recent Surveys
          </h2>
          <Link
            href="/admin/surveys"
            className="text-sm transition-colors duration-150 hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            View all
          </Link>
        </div>

        {surveys.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="w-full text-sm">
            <thead
              className="text-[11px] uppercase tracking-wider"
              style={{
                background: "var(--bg-surface-raised)",
                color: "var(--text-tertiary)",
              }}
            >
              <tr>
                <th className="px-6 py-3 text-left font-medium">Title</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-left font-medium">Created</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <motion.tbody
              initial="initial"
              animate="animate"
              variants={staggerContainer(stagger.fast)}
            >
              {surveys.slice(0, 10).map((survey, i) => (
                <motion.tr
                  key={survey.id}
                  variants={fadeUpVariants}
                  whileHover={{ backgroundColor: "var(--bg-surface-raised)" }}
                  transition={{ duration: 0.15 }}
                  style={{
                    borderTop:
                      i === 0 ? "none" : "1px solid var(--border-subtle)",
                  }}
                >
                  <td
                    className="px-6 py-4 font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {survey.title}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={survey.status} size="sm" />
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {survey.createdAt
                      ? new Date(survey.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/surveys/${survey.id}`}
                      className="font-medium hover:underline transition-colors duration-150"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      View
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        )}
      </motion.div>
    </>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "info" | "success" | "warning";
}) {
  const toneMap = {
    info: {
      bg: "var(--accent-primary-soft)",
      value: "var(--accent-primary)",
      border: "var(--border-interactive)",
    },
    success: {
      bg: "var(--accent-success-soft)",
      value: "var(--accent-success)",
      border: "color-mix(in srgb, var(--accent-success) 22%, transparent)",
    },
    warning: {
      bg: "var(--accent-warm-soft)",
      value: "var(--accent-warm)",
      border: "var(--border-warm)",
    },
  };
  const t = toneMap[tone];

  return (
    <motion.div
      variants={fadeUpVariants}
      whileHover={{ y: -2 }}
      transition={springs.gentle}
      className="rounded-[var(--radius-md)] border p-5 flex flex-col gap-1"
      style={{
        background: t.bg,
        borderColor: t.border,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <CountUp
        value={value}
        className="text-[32px] font-bold leading-none"
        style={{ color: t.value }}
      />
      <span
        className="text-sm font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...springs.gentle, delay: 0.2 }}
      className="px-6 py-16 text-center flex flex-col items-center gap-4"
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: "var(--accent-primary-soft)",
          color: "var(--accent-primary)",
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
          <path d="M9 12h6M12 9v6" />
          <rect x="3" y="4" width="18" height="16" rx="3" />
        </svg>
      </div>
      <div>
        <p
          className="text-sm font-medium mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          No surveys yet
        </p>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Start by pasting a questionnaire into your first survey.
        </p>
      </div>
      <Link
        href="/admin/surveys/new"
        className="inline-flex items-center gap-1 text-sm font-medium hover:underline mt-1"
        style={{ color: "var(--accent-primary)" }}
      >
        Create your first survey &rarr;
      </Link>
    </motion.div>
  );
}
