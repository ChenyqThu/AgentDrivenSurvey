"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useSurvey } from "@/hooks/use-survey";
import type { SurveySchema, SurveySection, SurveyQuestion } from "@/lib/survey/types";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  springs,
  fadeUpVariants,
  staggerContainer,
  stagger,
} from "@/lib/motion";

export default function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { survey, loading, error, fetchSurvey, publishSurvey, updateSurveyStatus } =
    useSurvey();
  const [copied, setCopied] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSurvey(id);
  }, [id, fetchSurvey]);

  async function handlePublish() {
    await publishSurvey(id);
  }

  async function handleStatus(status: string) {
    await updateSurveyStatus(id, status);
  }

  function getSurveyLink() {
    return `${window.location.origin}/s/${id}`;
  }

  function copyLink() {
    navigator.clipboard.writeText(getSurveyLink()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function toggleSection(sectionId: string) {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }

  if (loading && !survey) {
    return <SurveyDetailSkeleton />;
  }

  if (error && !survey) {
    return (
      <div className="p-8 text-sm" style={{ color: "var(--accent-danger)" }}>
        Error: {error}
      </div>
    );
  }

  if (!survey) return null;

  const schema = survey.schema as SurveySchema | null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-sm flex items-center gap-1 mb-2 transition-colors duration-150"
            style={{ color: "var(--text-secondary)" }}
          >
            &larr; Dashboard
          </Link>
          <h1
            className="text-[var(--type-display-size)] font-bold leading-[var(--type-display-line)] tracking-[var(--type-display-tracking)]"
            style={{ color: "var(--text-primary)" }}
          >
            {survey.title}
          </h1>
          {survey.description && (
            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {survey.description}
            </p>
          )}
        </div>
        <StatusBadge status={survey.status} size="md" />
      </div>

      {error && (
        <div
          className="mb-4 border text-sm rounded-[var(--radius-sm)] px-4 py-3"
          style={{
            background: "var(--accent-danger-soft)",
            borderColor: "color-mix(in srgb, var(--accent-danger) 25%, transparent)",
            color: "var(--accent-danger)",
          }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        {survey.status === "draft" && (
          <Button
            onClick={handlePublish}
            disabled={loading}
            loading={loading}
            variant="success"
          >
            {loading ? "Publishing…" : "Publish Survey"}
          </Button>
        )}
        {survey.status === "active" && (
          <>
            <Button
              onClick={() => handleStatus("paused")}
              disabled={loading}
              variant="warm"
            >
              Pause
            </Button>
            <Button
              onClick={() => handleStatus("closed")}
              disabled={loading}
              variant="outline"
            >
              Close
            </Button>
          </>
        )}
        {survey.status === "paused" && (
          <Button
            onClick={() => handleStatus("active")}
            disabled={loading}
            variant="success"
          >
            Resume
          </Button>
        )}
        <Link
          href={`/admin/surveys/${id}/responses`}
          className="inline-flex h-9 items-center gap-2 px-4 rounded-[var(--radius-sm)] border text-sm font-medium transition-colors duration-150"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          View Responses
        </Link>
      </div>

      {/* Survey link */}
      {survey.status === "active" && (
        <div
          className="mb-8 border rounded-[var(--radius-md)] p-4"
          style={{
            background: "var(--accent-primary-soft)",
            borderColor: "var(--border-interactive)",
          }}
        >
          <p
            className="text-xs font-medium mb-2"
            style={{ color: "var(--accent-primary)" }}
          >
            Survey Link
          </p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 text-sm border rounded-[var(--radius-sm)] px-3 py-2 truncate"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-interactive)",
                color: "var(--text-primary)",
              }}
            >
              {typeof window !== "undefined" ? getSurveyLink() : `/s/${id}`}
            </code>
            <Button
              onClick={copyLink}
              variant="secondary"
              size="sm"
              className="whitespace-nowrap"
              leftIcon={
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.svg
                      key="check"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={springs.bounce}
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M5 12l4 4L19 7" />
                    </motion.svg>
                  ) : (
                    <motion.svg
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.15 }}
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <rect x="9" y="9" width="12" height="12" rx="2" />
                      <path d="M5 15H3a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v2" />
                    </motion.svg>
                  )}
                </AnimatePresence>
              }
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      )}

      {/* Schema */}
      <div
        className="rounded-[var(--radius-md)] border overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          className="px-6 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h2
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            Survey Schema
          </h2>
          {schema?.metadata && (
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              {schema.metadata.totalQuestions} questions &middot; ~
              {schema.metadata.estimatedDuration} min &middot;{" "}
              {schema.metadata.language}
            </p>
          )}
        </div>

        {!schema ? (
          <div
            className="px-6 py-10 text-center text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            Schema not yet generated.
          </div>
        ) : (
          <div>
            {schema.sections.map((section: SurveySection, sectionIdx: number) => (
              <div
                key={section.id}
                style={{
                  borderTop:
                    sectionIdx === 0
                      ? "none"
                      : "1px solid var(--border-subtle)",
                }}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors duration-150 hover:bg-[var(--bg-surface-raised)]"
                >
                  <div>
                    <span
                      className="font-medium text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {section.title}
                    </span>
                    {section.description && (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {section.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {section.questions.length} questions
                    </span>
                    <motion.span
                      animate={{ rotate: openSections[section.id] ? 180 : 0 }}
                      transition={springs.snappy}
                      className="inline-flex"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <ChevronIcon className="w-4 h-4" />
                    </motion.span>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {openSections[section.id] && (
                    <motion.div
                      key="section-body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
                        opacity: { duration: 0.2 },
                      }}
                      style={{ overflow: "hidden" }}
                    >
                      <motion.div
                        className="px-6 pb-4 space-y-3"
                        initial="initial"
                        animate="animate"
                        variants={staggerContainer(stagger.fast)}
                      >
                        {section.questions.map((q: SurveyQuestion) => (
                          <motion.div
                            key={q.id}
                            variants={fadeUpVariants}
                            className="rounded-[var(--radius-sm)] p-4 border"
                            style={{
                              background: "var(--bg-surface-raised)",
                              borderColor: "var(--border-subtle)",
                            }}
                          >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p
                            className="text-sm font-medium leading-snug"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {q.text}
                          </p>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                            style={{
                              background: "var(--bg-surface)",
                              color: "var(--text-secondary)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            {q.type.replace("_", " ")}
                          </span>
                        </div>
                        {q.required && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--accent-danger)" }}
                          >
                            Required
                          </span>
                        )}
                        {q.extractionFields.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {q.extractionFields.map((f) => (
                              <span
                                key={f.key}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: "var(--accent-primary-soft)",
                                  color: "var(--accent-primary)",
                                }}
                                title={f.description}
                              >
                                {f.key}: {f.type}
                              </span>
                            ))}
                          </div>
                        )}
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SurveyDetailSkeleton() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-9 w-2/3 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex gap-3 mb-8">
        <Skeleton className="h-9 w-28 rounded-[var(--radius-sm)]" />
        <Skeleton className="h-9 w-32 rounded-[var(--radius-sm)]" />
      </div>
      <div
        className="rounded-[var(--radius-md)] border overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div
          className="px-6 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="p-6 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChevronIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
