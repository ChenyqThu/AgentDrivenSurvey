"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cardExpandVariants, springs } from "@/lib/motion";

export interface CardData {
  id: string;
  type: string;
  question: string;
  options?: string[];
  config?: Record<string, unknown>;
}

interface InteractiveCardProps {
  card: CardData;
  onSubmit: (cardId: string, value: unknown) => void;
  disabled?: boolean;
}

export function InteractiveCard({ card, onSubmit, disabled }: InteractiveCardProps) {
  switch (card.type) {
    case "nps":
      return <NPSCard card={card} onSubmit={onSubmit} disabled={disabled} />;
    case "rating":
      return <RatingCard card={card} onSubmit={onSubmit} disabled={disabled} />;
    case "multiple_choice":
      return <MultipleChoiceCard card={card} onSubmit={onSubmit} disabled={disabled} />;
    case "multi_select":
      return <MultiSelectCard card={card} onSubmit={onSubmit} disabled={disabled} />;
    case "yes_no":
      return <YesNoCard card={card} onSubmit={onSubmit} disabled={disabled} />;
    case "likert":
      return <LikertCard card={card} onSubmit={onSubmit} disabled={disabled} />;
    case "slider":
      return <SliderCard card={card} onSubmit={onSubmit} disabled={disabled} />;
    default:
      return null;
  }
}

// ─── NPS Card ───────────────────────────────────────────────────────────────

function NPSCard({ card, onSubmit, disabled }: InteractiveCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const lowLabel = (card.config?.lowLabel as string) ?? "Not at all likely";
  const highLabel = (card.config?.highLabel as string) ?? "Extremely likely";

  function getBgColor(n: number): string {
    if (n <= 3) return "var(--gradient-nps-low)";
    if (n <= 6) return "var(--gradient-nps-mid)";
    return "var(--gradient-nps-high)";
  }

  function getTextColor(n: number): string {
    if (n <= 3) return "var(--accent-danger)";
    if (n <= 6) return "var(--accent-warm)";
    return "var(--accent-success)";
  }

  function handleSelect(n: number) {
    if (disabled || submitted) return;
    setSelected(n);
    setSubmitted(true);
    onSubmit(card.id, n);
  }

  return (
    <CardWrapper submitted={submitted}>
      <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">{card.question}</p>
      <div className="flex gap-[6px] flex-wrap justify-center">
        {Array.from({ length: 11 }, (_, i) => {
          const isSelected = submitted && selected === i;
          const isDisabled = submitted && selected !== i;
          return (
            <motion.button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={disabled || submitted}
              whileHover={!submitted ? { scale: 1.1, y: -2 } : undefined}
              whileTap={!submitted ? { scale: 0.95 } : undefined}
              transition={springs.bounce}
              aria-label={`${i} 分`}
              className={`relative min-w-[2.75rem] min-h-[44px] px-1 rounded-full text-sm font-bold transition-all duration-200${isSelected ? " pulse-ring" : ""}`}
              style={{
                background: isDisabled
                  ? "var(--bg-surface-raised)"
                  : getBgColor(i),
                color: isDisabled
                  ? "var(--text-tertiary)"
                  : getTextColor(i),
                boxShadow: isSelected
                  ? `0 0 0 2px ${getTextColor(i)}40, var(--shadow-md)`
                  : "none",
                cursor: submitted ? "default" : "pointer",
              }}
            >
              {i}
            </motion.button>
          );
        })}
      </div>
      <div className="flex justify-between mt-2.5 text-[12px] text-[var(--text-tertiary)] px-1">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      {submitted && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-[12px] text-center text-[var(--text-secondary)]"
        >
          已选择 <span className="font-semibold text-[var(--text-primary)]">{selected}</span>
        </motion.p>
      )}
    </CardWrapper>
  );
}

// ─── Rating Card ─────────────────────────────────────────────────────────────

function RatingCard({ card, onSubmit, disabled }: InteractiveCardProps) {
  const maxStars = (card.config?.maxStars as number) ?? 5;
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSelect(n: number) {
    if (disabled || submitted) return;
    setSelected(n);
    setSubmitted(true);
    onSubmit(card.id, n);
  }

  const display = !submitted ? (hovered ?? selected ?? 0) : (selected ?? 0);

  return (
    <CardWrapper submitted={submitted}>
      <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">{card.question}</p>
      <div className="flex gap-1 justify-center">
        {Array.from({ length: maxStars }, (_, i) => {
          const starVal = i + 1;
          const filled = starVal <= display;
          return (
            <motion.button
              key={starVal}
              onClick={() => handleSelect(starVal)}
              onMouseEnter={() => !submitted && setHovered(starVal)}
              onMouseLeave={() => !submitted && setHovered(null)}
              disabled={disabled || submitted}
              whileHover={!submitted ? { scale: 1.2, y: -2 } : undefined}
              whileTap={!submitted ? { scale: 0.9 } : undefined}
              transition={springs.bounce}
              aria-label={`${starVal} / ${maxStars} 星`}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-150${submitted && selected === starVal ? " pulse-ring" : ""}`}
              style={{ cursor: submitted ? "default" : "pointer" }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill={filled ? "#F59F00" : "none"}
                stroke={filled ? "#F59F00" : "var(--border-subtle)"}
                strokeWidth="1.5"
                className="transition-all duration-200"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </motion.button>
          );
        })}
      </div>
      {submitted && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-[12px] text-center text-[var(--text-secondary)]"
        >
          已评分 <span className="font-semibold text-[var(--text-primary)]">{selected} / {maxStars}</span>
        </motion.p>
      )}
    </CardWrapper>
  );
}

// ─── Multiple Choice Card ─────────────────────────────────────────────────────

function MultipleChoiceCard({ card, onSubmit, disabled }: InteractiveCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const options = card.options ?? [];

  function handleSelect(opt: string) {
    if (disabled || submitted) return;
    setSelected(opt);
    setSubmitted(true);
    onSubmit(card.id, opt);
  }

  return (
    <CardWrapper submitted={submitted}>
      <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-3">{card.question}</p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const isSelected = submitted && selected === opt;
          const isDisabled = submitted && selected !== opt;
          return (
            <motion.button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={disabled || submitted}
              whileHover={!submitted ? { x: 4 } : undefined}
              whileTap={!submitted ? { scale: 0.98 } : undefined}
              transition={springs.snappy}
              className={`w-full text-left px-4 py-3 rounded-[var(--radius-sm)] text-[14px] border transition-all duration-200 min-h-[44px] flex items-center gap-3${isSelected ? " pulse-ring" : ""}`}
              style={{
                background: isSelected
                  ? "var(--accent-primary)"
                  : isDisabled
                  ? "var(--bg-surface-raised)"
                  : "var(--bg-surface)",
                color: isSelected
                  ? "white"
                  : isDisabled
                  ? "var(--text-tertiary)"
                  : "var(--text-primary)",
                borderColor: isSelected
                  ? "var(--accent-primary)"
                  : "var(--border-subtle)",
                cursor: submitted ? "default" : "pointer",
              }}
            >
              {/* Left accent bar on hover/select */}
              <span
                className="w-[3px] rounded-full self-stretch transition-all duration-200"
                style={{
                  background: isSelected ? "rgba(255,255,255,0.5)" : "transparent",
                }}
              />
              {opt}
            </motion.button>
          );
        })}
      </div>
    </CardWrapper>
  );
}

// ─── Multi Select Card ────────────────────────────────────────────────────────

function MultiSelectCard({ card, onSubmit, disabled }: InteractiveCardProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const options = card.options ?? [];
  const minSelect = (card.config?.minSelect as number) ?? 1;
  const maxSelect = (card.config?.maxSelect as number) ?? options.length;

  function toggleOption(opt: string) {
    if (disabled || submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) {
        next.delete(opt);
      } else if (next.size < maxSelect) {
        next.add(opt);
      }
      return next;
    });
  }

  function handleSubmit() {
    if (submitted || selected.size < minSelect) return;
    setSubmitted(true);
    onSubmit(card.id, Array.from(selected));
  }

  return (
    <CardWrapper submitted={submitted}>
      <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">{card.question}</p>
      {!submitted && (
        <p className="text-[12px] text-[var(--text-tertiary)] mb-3">
          选择 {minSelect === maxSelect ? minSelect : `${minSelect}–${maxSelect}`} 项
        </p>
      )}
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const isSelected = selected.has(opt);
          return (
            <motion.button
              key={opt}
              onClick={() => toggleOption(opt)}
              disabled={disabled || submitted}
              whileTap={!submitted ? { scale: 0.98 } : undefined}
              transition={springs.snappy}
              className="w-full text-left px-4 py-3 rounded-[var(--radius-sm)] text-[14px] border transition-all duration-200 flex items-center gap-3 min-h-[44px]"
              style={{
                background: submitted && isSelected
                  ? "var(--accent-primary)"
                  : submitted
                  ? "var(--bg-surface-raised)"
                  : isSelected
                  ? "var(--accent-primary-soft)"
                  : "var(--bg-surface)",
                color: submitted && isSelected
                  ? "white"
                  : submitted && !isSelected
                  ? "var(--text-tertiary)"
                  : isSelected
                  ? "var(--accent-primary)"
                  : "var(--text-primary)",
                borderColor: isSelected && !submitted
                  ? "var(--accent-primary)"
                  : "var(--border-subtle)",
                cursor: submitted ? "default" : "pointer",
              }}
            >
              {/* Checkbox */}
              <span
                className="w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  borderColor: isSelected
                    ? submitted ? "rgba(255,255,255,0.5)" : "var(--accent-primary)"
                    : "var(--border-subtle)",
                  background: isSelected
                    ? submitted ? "rgba(255,255,255,0.2)" : "var(--accent-primary)"
                    : "transparent",
                }}
              >
                {isSelected && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={springs.bounce}
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 10 8"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 4l3 3 5-6" />
                  </motion.svg>
                )}
              </span>
              {opt}
            </motion.button>
          );
        })}
      </div>
      {!submitted && (
        <motion.button
          onClick={handleSubmit}
          disabled={selected.size < minSelect}
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
          className="mt-3 w-full py-3 rounded-[var(--radius-xl)] text-[14px] font-semibold text-white transition-all duration-200 min-h-[44px]"
          style={{
            background: selected.size >= minSelect ? "var(--gradient-hero)" : "var(--bg-surface-raised)",
            color: selected.size >= minSelect ? "white" : "var(--text-tertiary)",
            cursor: selected.size < minSelect ? "not-allowed" : "pointer",
          }}
        >
          确认
        </motion.button>
      )}
    </CardWrapper>
  );
}

// ─── Yes/No Card ──────────────────────────────────────────────────────────────

function YesNoCard({ card, onSubmit, disabled }: InteractiveCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const yesLabel = (card.config?.yesLabel as string) ?? "Yes";
  const noLabel = (card.config?.noLabel as string) ?? "No";

  function handleSelect(val: string) {
    if (disabled || submitted) return;
    setSelected(val);
    setSubmitted(true);
    onSubmit(card.id, val);
  }

  return (
    <CardWrapper submitted={submitted}>
      <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">{card.question}</p>
      <div className="flex gap-3">
        {/* Yes/primary button — gradient style */}
        <motion.button
          onClick={() => handleSelect("yes")}
          disabled={disabled || submitted}
          whileHover={!submitted ? { y: -2, scale: 1.02 } : undefined}
          whileTap={!submitted ? { scale: 0.96 } : undefined}
          transition={springs.snappy}
          className={`flex-1 py-3 rounded-[var(--radius-xl)] text-[14px] font-semibold transition-all duration-200 min-h-[44px]${submitted && selected === "yes" ? " pulse-ring" : ""}`}
          style={{
            background: submitted && selected === "yes"
              ? "var(--accent-primary)"
              : submitted
              ? "var(--bg-surface-raised)"
              : "var(--gradient-hero)",
            color: submitted && selected !== "yes" ? "var(--text-tertiary)" : "white",
            boxShadow: !submitted ? "var(--shadow-md)" : "none",
            cursor: submitted ? "default" : "pointer",
          }}
        >
          {yesLabel}
        </motion.button>
        {/* No/secondary button — outline style */}
        <motion.button
          onClick={() => handleSelect("no")}
          disabled={disabled || submitted}
          whileHover={!submitted ? { y: -1 } : undefined}
          whileTap={!submitted ? { scale: 0.96 } : undefined}
          transition={springs.snappy}
          className={`flex-1 py-3 rounded-[var(--radius-xl)] text-[14px] font-medium border transition-all duration-200 min-h-[44px]${submitted && selected === "no" ? " pulse-ring" : ""}`}
          style={{
            background: submitted && selected === "no"
              ? "var(--accent-primary)"
              : "var(--bg-surface)",
            color: submitted && selected === "no"
              ? "white"
              : submitted
              ? "var(--text-tertiary)"
              : "var(--text-secondary)",
            borderColor: submitted && selected !== "no" ? "var(--border-subtle)" : "var(--border-interactive)",
            cursor: submitted ? "default" : "pointer",
          }}
        >
          {noLabel}
        </motion.button>
      </div>
    </CardWrapper>
  );
}

// ─── Likert Card ──────────────────────────────────────────────────────────────

function LikertCard({ card, onSubmit, disabled }: InteractiveCardProps) {
  const points = (card.config?.points as number) ?? 5;
  const configLabels = card.config?.labels as string[] | undefined;
  const defaultLabels5 = [
    "Strongly Disagree",
    "Disagree",
    "Neutral",
    "Agree",
    "Strongly Agree",
  ];
  const defaultLabels7 = [
    "Strongly Disagree",
    "Disagree",
    "Somewhat Disagree",
    "Neutral",
    "Somewhat Agree",
    "Agree",
    "Strongly Agree",
  ];
  const labels =
    configLabels ??
    (points === 7 ? defaultLabels7 : defaultLabels5).slice(0, points);

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSelect(idx: number) {
    if (disabled || submitted) return;
    setSelected(idx);
    setSubmitted(true);
    onSubmit(card.id, { value: idx + 1, label: labels[idx] });
  }

  return (
    <CardWrapper submitted={submitted}>
      <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">{card.question}</p>
      <div className="flex gap-[6px] justify-center">
        {Array.from({ length: points }, (_, i) => {
          const isSelected = submitted && selected === i;
          const isDisabled = submitted && selected !== i;
          return (
            <motion.button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={disabled || submitted}
              whileHover={!submitted ? { scale: 1.08, y: -1 } : undefined}
              whileTap={!submitted ? { scale: 0.95 } : undefined}
              transition={springs.snappy}
              title={labels[i]}
              className={`flex-1 py-3 rounded-[var(--radius-xs)] text-[13px] font-semibold border transition-all duration-200 min-h-[44px]${isSelected ? " pulse-ring" : ""}`}
              style={{
                background: isSelected
                  ? "var(--accent-primary)"
                  : isDisabled
                  ? "var(--bg-surface-raised)"
                  : "var(--bg-surface)",
                color: isSelected
                  ? "white"
                  : isDisabled
                  ? "var(--text-tertiary)"
                  : "var(--text-primary)",
                borderColor: isSelected ? "var(--accent-primary)" : "var(--border-subtle)",
                cursor: submitted ? "default" : "pointer",
              }}
            >
              {i + 1}
            </motion.button>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[12px] text-[var(--text-tertiary)] px-0.5">
        <span className="max-w-[40%] text-left">{labels[0]}</span>
        <span className="max-w-[40%] text-right">{labels[labels.length - 1]}</span>
      </div>
      {submitted && selected !== null && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-[12px] text-center text-[var(--text-secondary)]"
        >
          已选择 <span className="font-semibold text-[var(--text-primary)]">{labels[selected]}</span>
        </motion.p>
      )}
    </CardWrapper>
  );
}

// ─── Slider Card ──────────────────────────────────────────────────────────────

function SliderCard({ card, onSubmit, disabled }: InteractiveCardProps) {
  const min = (card.config?.min as number) ?? 0;
  const max = (card.config?.max as number) ?? 100;
  const step = (card.config?.step as number) ?? 1;
  const unit = (card.config?.unit as string) ?? "";

  const [value, setValue] = useState<number>(Math.round((min + max) / 2));
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    onSubmit(card.id, value);
  }

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <CardWrapper submitted={submitted}>
      <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">{card.question}</p>
      <div className="px-2">
        <div className="flex justify-between text-[12px] text-[var(--text-tertiary)] mb-2">
          <span>{min}{unit}</span>
          <span
            className="text-[18px] font-bold tabular-nums"
            style={{ color: "var(--accent-primary)" }}
          >
            {value}{unit}
          </span>
          <span>{max}{unit}</span>
        </div>
        <div className="relative h-8 flex items-center">
          {/* Track background */}
          <div
            className="absolute inset-x-0 h-[6px] rounded-full"
            style={{ background: "var(--bg-surface-raised)" }}
          />
          {/* Track fill */}
          <div
            className="absolute left-0 h-[6px] rounded-full transition-all duration-100"
            style={{
              width: `${pct}%`,
              background: "var(--gradient-hero)",
            }}
          />
          {/* Native range input */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => !submitted && setValue(Number(e.target.value))}
            disabled={disabled || submitted}
            className="absolute inset-x-0 w-full h-[6px] appearance-none bg-transparent cursor-pointer disabled:cursor-default"
          />
        </div>
      </div>
      {!submitted && (
        <motion.button
          onClick={handleSubmit}
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
          className="mt-4 w-full py-3 rounded-[var(--radius-xl)] text-[14px] font-semibold text-white transition-colors min-h-[44px]"
          style={{ background: "var(--gradient-hero)" }}
        >
          确认
        </motion.button>
      )}
      {submitted && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-[12px] text-center text-[var(--text-secondary)]"
        >
          已选择 <span className="font-semibold text-[var(--text-primary)]">{value}{unit}</span>
        </motion.p>
      )}
    </CardWrapper>
  );
}

// ─── Shared wrapper ───────────────────────────────────────────────────────────

function CardWrapper({
  children,
  submitted,
}: {
  children: React.ReactNode;
  submitted: boolean;
}) {
  return (
    <motion.div
      dir="auto"
      variants={cardExpandVariants}
      initial="initial"
      animate="animate"
      className="mt-2 rounded-[var(--radius-lg)] border px-5 py-4 w-full transition-all duration-300"
      style={{
        borderColor: submitted ? "var(--border-subtle)" : "var(--border-interactive)",
        background: submitted ? "var(--bg-surface-raised)" : "var(--bg-surface)",
        boxShadow: submitted ? "none" : "var(--shadow-card)",
        opacity: submitted ? 0.85 : 1,
      }}
    >
      {children}
    </motion.div>
  );
}
