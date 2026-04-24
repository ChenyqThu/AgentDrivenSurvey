"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { fadeUpVariants, staggerContainer, stagger } from "@/lib/motion";

export default function NewSurveyPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [product, setProduct] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [focusAreas, setFocusAreas] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !rawInput.trim()) {
      setError("Title and questionnaire text are required.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          rawInput: rawInput.trim(),
          context: {
            product: product.trim(),
            targetUsers: targetUsers.trim(),
            focusAreas: focusAreas
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create survey");
      }

      const data = await res.json();
      router.push(`/admin/surveys/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-surface)",
    borderColor: "var(--border-subtle)",
    color: "var(--text-primary)",
  };

  const inputClass =
    "w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent";

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm flex items-center gap-1 transition-colors duration-150 hover:text-[var(--text-primary)]"
          style={{ color: "var(--text-secondary)" }}
        >
          &larr; Dashboard
        </Link>
        <h1
          className="text-[var(--type-display-size)] font-bold leading-[var(--type-display-line)] tracking-[var(--type-display-tracking)] mt-3"
          style={{ color: "var(--text-primary)" }}
        >
          Create New Survey
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Paste your questionnaire and the AI will generate a structured survey
          schema.
        </p>
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

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
        initial="initial"
        animate="animate"
        variants={staggerContainer(stagger.normal)}
      >
        {/* Basic info */}
        <FormSection title="Basic Information">
          <FormField
            label="Survey Title"
            required
          >
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Product Satisfaction Survey Q1 2025"
              className={inputClass}
              style={inputStyle}
            />
          </FormField>

          <FormField
            label="Description"
            hint="(optional)"
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of the survey's purpose"
              className={`${inputClass} resize-none`}
              style={inputStyle}
            />
          </FormField>
        </FormSection>

        {/* Questionnaire */}
        <FormSection
          title="Questionnaire"
          description="Paste your raw questionnaire. The AI will parse it into a structured schema."
        >
          <FormField
            label="Questionnaire Text"
            required
          >
            <textarea
              required
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={10}
              placeholder={
                "1. How satisfied are you with our product?\n2. What features do you use most?\n3. Would you recommend us to a friend?"
              }
              className={`${inputClass} font-mono resize-y`}
              style={inputStyle}
            />
          </FormField>
        </FormSection>

        {/* Context */}
        <FormSection
          title="Context"
          hint="(optional, improves AI quality)"
        >
          <FormField label="Product / Service">
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g. Mobile banking app"
              className={inputClass}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Target Users">
            <input
              type="text"
              value={targetUsers}
              onChange={(e) => setTargetUsers(e.target.value)}
              placeholder="e.g. Young professionals aged 25-35"
              className={inputClass}
              style={inputStyle}
            />
          </FormField>

          <FormField
            label="Focus Areas"
            hint="(comma-separated)"
          >
            <input
              type="text"
              value={focusAreas}
              onChange={(e) => setFocusAreas(e.target.value)}
              placeholder="e.g. usability, pricing, customer support"
              className={inputClass}
              style={inputStyle}
            />
          </FormField>
        </FormSection>

        <div className="flex items-center justify-between pt-2">
          <Link
            href="/admin"
            className="text-sm transition-colors duration-150 hover:text-[var(--text-primary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            variant="primary"
            size="lg"
            style={loading ? undefined : { background: "var(--gradient-hero)" }}
          >
            {loading ? "Generating schema…" : "Create Survey"}
          </Button>
        </div>

        {loading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-center -mt-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            The AI is generating the survey schema. This may take 10–30 seconds.
          </motion.p>
        )}
      </motion.form>
    </div>
  );
}

function FormSection({
  title,
  description,
  hint,
  children,
}: {
  title: string;
  description?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUpVariants}
      className="rounded-[var(--radius-md)] border p-6 space-y-5"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div>
        <h2
          className="text-xs uppercase tracking-wider font-semibold"
          style={{ color: "var(--text-tertiary)" }}
        >
          {title}{" "}
          {hint && (
            <span
              className="font-normal normal-case tracking-normal"
              style={{ color: "var(--text-tertiary)" }}
            >
              {hint}
            </span>
          )}
        </h2>
        {description && (
          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-tertiary)" }}
          >
            {description}
          </p>
        )}
      </div>
      {children}
    </motion.div>
  );
}

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: "var(--text-primary)" }}
      >
        {label}{" "}
        {required && (
          <span style={{ color: "var(--accent-danger)" }}>*</span>
        )}
        {hint && (
          <span
            className="font-normal"
            style={{ color: "var(--text-tertiary)" }}
          >
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
