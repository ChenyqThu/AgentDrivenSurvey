"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSurvey } from "@/hooks/use-survey";
import type { SurveySchema, SurveySection, SurveyQuestion } from "@/lib/survey/types";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  paused: "bg-orange-100 text-orange-800",
  closed: "bg-gray-100 text-gray-600",
};

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
    return (
      <div className="p-8 flex items-center justify-center text-gray-400 text-sm">
        Loading survey…
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="p-8 text-red-600 text-sm">
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
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
          {survey.description && (
            <p className="text-sm text-gray-500 mt-1">{survey.description}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize flex-shrink-0 mt-1 ${
            STATUS_COLORS[survey.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {survey.status}
        </span>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        {survey.status === "draft" && (
          <button
            onClick={handlePublish}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "Publishing…" : "Publish Survey"}
          </button>
        )}
        {survey.status === "active" && (
          <>
            <button
              onClick={() => handleStatus("paused")}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              Pause
            </button>
            <button
              onClick={() => handleStatus("closed")}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-60 transition-colors"
            >
              Close
            </button>
          </>
        )}
        {survey.status === "paused" && (
          <button
            onClick={() => handleStatus("active")}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            Resume
          </button>
        )}
        <Link
          href={`/admin/surveys/${id}/responses`}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          View Responses
        </Link>
      </div>

      {/* Survey link */}
      {survey.status === "active" && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-700 mb-2">Survey Link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-700 truncate">
              {typeof window !== "undefined" ? getSurveyLink() : `/s/${id}`}
            </code>
            <button
              onClick={copyLink}
              className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Schema */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Survey Schema</h2>
          {schema?.metadata && (
            <p className="text-xs text-gray-400 mt-0.5">
              {schema.metadata.totalQuestions} questions &middot; ~
              {schema.metadata.estimatedDuration} min &middot;{" "}
              {schema.metadata.language}
            </p>
          )}
        </div>

        {!schema ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            Schema not yet generated.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {schema.sections.map((section: SurveySection) => (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <span className="font-medium text-gray-900 text-sm">
                      {section.title}
                    </span>
                    {section.description && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {section.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400">
                      {section.questions.length} questions
                    </span>
                    <ChevronIcon
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        openSections[section.id] ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {openSections[section.id] && (
                  <div className="px-6 pb-4 space-y-3">
                    {section.questions.map((q: SurveyQuestion) => (
                      <div
                        key={q.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm text-gray-800 font-medium leading-snug">
                            {q.text}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 whitespace-nowrap flex-shrink-0">
                            {q.type.replace("_", " ")}
                          </span>
                        </div>
                        {q.required && (
                          <span className="text-xs text-red-500">Required</span>
                        )}
                        {q.extractionFields.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {q.extractionFields.map((f) => (
                              <span
                                key={f.key}
                                className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                                title={f.description}
                              >
                                {f.key}: {f.type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
