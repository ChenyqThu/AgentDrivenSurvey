"use client";

import { useState } from "react";

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

  function getColor(n: number) {
    if (n <= 3) return "bg-red-500 hover:bg-red-600 text-white border-red-500";
    if (n <= 6) return "bg-yellow-400 hover:bg-yellow-500 text-gray-900 border-yellow-400";
    return "bg-green-500 hover:bg-green-600 text-white border-green-500";
  }

  function getSelectedColor(n: number) {
    if (n <= 3) return "bg-red-600 text-white border-red-700 ring-2 ring-red-300";
    if (n <= 6) return "bg-yellow-500 text-gray-900 border-yellow-600 ring-2 ring-yellow-200";
    return "bg-green-600 text-white border-green-700 ring-2 ring-green-300";
  }

  function handleSelect(n: number) {
    if (disabled || submitted) return;
    setSelected(n);
    setSubmitted(true);
    onSubmit(card.id, n);
  }

  return (
    <CardWrapper submitted={submitted}>
      <p className="text-sm font-semibold text-gray-800 mb-4">{card.question}</p>
      <div className="flex gap-1 flex-wrap justify-center">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={disabled || submitted}
            className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all duration-150 ${
              submitted && selected === i
                ? getSelectedColor(i)
                : submitted
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-default"
                : `${getColor(i)} cursor-pointer`
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400 px-1">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      {submitted && (
        <p className="mt-3 text-xs text-center text-gray-500">
          已选择 <span className="font-semibold text-gray-700">{selected}</span>
        </p>
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
      <p className="text-sm font-semibold text-gray-800 mb-4">{card.question}</p>
      <div className="flex gap-2 justify-center">
        {Array.from({ length: maxStars }, (_, i) => {
          const starVal = i + 1;
          const filled = starVal <= display;
          return (
            <button
              key={starVal}
              onClick={() => handleSelect(starVal)}
              onMouseEnter={() => !submitted && setHovered(starVal)}
              onMouseLeave={() => !submitted && setHovered(null)}
              disabled={disabled || submitted}
              className={`text-3xl transition-transform duration-100 ${
                submitted ? "cursor-default" : "hover:scale-110 cursor-pointer"
              } ${filled ? "text-yellow-400" : "text-gray-200"}`}
            >
              ★
            </button>
          );
        })}
      </div>
      {submitted && (
        <p className="mt-3 text-xs text-center text-gray-500">
          已评分 <span className="font-semibold text-gray-700">{selected} / {maxStars}</span>
        </p>
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
      <p className="text-sm font-semibold text-gray-800 mb-3">{card.question}</p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            disabled={disabled || submitted}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all duration-150 ${
              submitted && selected === opt
                ? "bg-blue-600 text-white border-blue-600 font-medium"
                : submitted
                ? "bg-gray-50 text-gray-400 border-gray-200 cursor-default"
                : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
            }`}
          >
            {opt}
          </button>
        ))}
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
      <p className="text-sm font-semibold text-gray-800 mb-1">{card.question}</p>
      {!submitted && (
        <p className="text-xs text-gray-400 mb-3">
          选择 {minSelect === maxSelect ? minSelect : `${minSelect}–${maxSelect}`} 项
        </p>
      )}
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const isSelected = selected.has(opt);
          return (
            <button
              key={opt}
              onClick={() => toggleOption(opt)}
              disabled={disabled || submitted}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all duration-150 flex items-center gap-3 ${
                submitted && isSelected
                  ? "bg-blue-600 text-white border-blue-600 font-medium"
                  : submitted
                  ? "bg-gray-50 text-gray-400 border-gray-200 cursor-default"
                  : isSelected
                  ? "bg-blue-50 text-blue-700 border-blue-400 font-medium"
                  : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
              }`}
            >
              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected
                  ? submitted ? "border-white bg-white" : "border-blue-500 bg-blue-500"
                  : submitted ? "border-gray-300" : "border-gray-300"
              }`}>
                {isSelected && (
                  <svg className={`w-2.5 h-2.5 ${submitted ? "text-blue-600" : "text-white"}`} fill="none" viewBox="0 0 10 8">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected.size < minSelect}
          className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          确认
        </button>
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
      <p className="text-sm font-semibold text-gray-800 mb-4">{card.question}</p>
      <div className="flex gap-3">
        <button
          onClick={() => handleSelect("yes")}
          disabled={disabled || submitted}
          className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-150 ${
            submitted && selected === "yes"
              ? "bg-green-600 text-white border-green-600"
              : submitted
              ? "bg-gray-50 text-gray-300 border-gray-200 cursor-default"
              : "bg-white text-green-700 border-green-400 hover:bg-green-50 cursor-pointer"
          }`}
        >
          {yesLabel}
        </button>
        <button
          onClick={() => handleSelect("no")}
          disabled={disabled || submitted}
          className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-150 ${
            submitted && selected === "no"
              ? "bg-red-500 text-white border-red-500"
              : submitted
              ? "bg-gray-50 text-gray-300 border-gray-200 cursor-default"
              : "bg-white text-red-600 border-red-300 hover:bg-red-50 cursor-pointer"
          }`}
        >
          {noLabel}
        </button>
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
      <p className="text-sm font-semibold text-gray-800 mb-4">{card.question}</p>
      <div className="flex gap-1.5 justify-center">
        {Array.from({ length: points }, (_, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={disabled || submitted}
            title={labels[i]}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
              submitted && selected === i
                ? "bg-blue-600 text-white border-blue-700"
                : submitted
                ? "bg-gray-50 text-gray-300 border-gray-200 cursor-default"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-gray-400 px-0.5">
        <span className="max-w-[40%] text-left">{labels[0]}</span>
        <span className="max-w-[40%] text-right">{labels[labels.length - 1]}</span>
      </div>
      {submitted && selected !== null && (
        <p className="mt-3 text-xs text-center text-gray-500">
          已选择 <span className="font-semibold text-gray-700">{labels[selected]}</span>
        </p>
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
      <p className="text-sm font-semibold text-gray-800 mb-4">{card.question}</p>
      <div className="px-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{min}{unit}</span>
          <span className="text-base font-bold text-blue-600">
            {value}{unit}
          </span>
          <span>{max}{unit}</span>
        </div>
        <div className="relative h-6 flex items-center">
          <div className="absolute inset-x-0 h-2 rounded-full bg-gray-200" />
          <div
            className="absolute left-0 h-2 rounded-full bg-blue-500"
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => !submitted && setValue(Number(e.target.value))}
            disabled={disabled || submitted}
            className="absolute inset-x-0 w-full h-2 appearance-none bg-transparent cursor-pointer disabled:cursor-default [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-md"
          />
        </div>
      </div>
      {!submitted && (
        <button
          onClick={handleSubmit}
          className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          确认
        </button>
      )}
      {submitted && (
        <p className="mt-3 text-xs text-center text-gray-500">
          已选择 <span className="font-semibold text-gray-700">{value}{unit}</span>
        </p>
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
    <div
      dir="auto"
      className={`mt-2 rounded-2xl border px-5 py-4 max-w-sm w-full transition-all duration-300 ${
        submitted
          ? "border-gray-200 bg-gray-50 opacity-80"
          : "border-blue-200 bg-white shadow-md"
      }`}
    >
      {children}
    </div>
  );
}
