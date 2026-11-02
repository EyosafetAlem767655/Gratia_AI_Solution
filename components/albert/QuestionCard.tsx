"use client";

import { Check } from "lucide-react";
import type { AlbertQuestion } from "@/lib/albert/types";
import { ALBERT } from "@/lib/content";

export type DraftAnswer = { choices: string[]; other: string; otherOn: boolean; text: string };
export const emptyDraft = (): DraftAnswer => ({ choices: [], other: "", otherOn: false, text: "" });

const field =
  "w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 outline-none ring-1 ring-inset ring-white/15 transition-colors focus:bg-white/15 focus:ring-white/40";

/**
 * One of Albert's questions.
 *
 * single — pick one (choosing "Other" clears the listed choice, and vice versa)
 * multi  — pick any, plus "Other"
 * text   — free answer
 */
export function QuestionCard({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: AlbertQuestion;
  value: DraftAnswer;
  onChange: (next: DraftAnswer) => void;
}) {
  const single = question.type === "single";

  function toggle(option: string) {
    const chosen = value.choices.includes(option);
    if (single) {
      onChange({ ...value, choices: chosen ? [] : [option], otherOn: false, other: "" });
    } else {
      onChange({
        ...value,
        choices: chosen ? value.choices.filter((c) => c !== option) : [...value.choices, option],
      });
    }
  }

  function toggleOther() {
    const on = !value.otherOn;
    onChange({
      ...value,
      otherOn: on,
      other: on ? value.other : "",
      choices: single && on ? [] : value.choices,
    });
  }

  const labelId = `q-${question.id}`;

  return (
    <fieldset className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10 sm:p-5">
      <legend id={labelId} className="sr-only">
        {question.text}
      </legend>
      <p aria-hidden className="mb-3 text-sm font-medium leading-relaxed text-white sm:text-base">
        <span className="mr-2 text-white/50">{index}.</span>
        {question.text}
        {question.type === "multi" && (
          <span className="ml-2 text-xs font-normal text-white/50">(choose any)</span>
        )}
      </p>

      {question.type === "text" ? (
        <textarea
          aria-labelledby={labelId}
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          maxLength={1500}
          rows={3}
          placeholder={ALBERT.textPlaceholder}
          className={`${field} resize-none`}
        />
      ) : (
        <div className="flex flex-wrap gap-2" role={single ? "radiogroup" : "group"} aria-labelledby={labelId}>
          {question.options.map((option) => (
            <Chip
              key={option}
              single={single}
              selected={value.choices.includes(option)}
              onClick={() => toggle(option)}
            >
              {option}
            </Chip>
          ))}
          {question.allowOther && (
            <Chip single={single} selected={value.otherOn} onClick={toggleOther}>
              {ALBERT.other}
            </Chip>
          )}
        </div>
      )}

      {value.otherOn && (
        <input
          autoFocus
          aria-label={`${question.text} — other`}
          value={value.other}
          onChange={(e) => onChange({ ...value, other: e.target.value })}
          maxLength={500}
          placeholder={ALBERT.otherPlaceholder}
          className={`${field} mt-3`}
        />
      )}
    </fieldset>
  );
}

function Chip({
  single,
  selected,
  onClick,
  children,
}: {
  single: boolean;
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role={single ? "radio" : "checkbox"}
      aria-checked={selected}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-left text-sm transition-colors ${
        selected
          ? "bg-white text-black"
          : "bg-white/10 text-white/85 ring-1 ring-inset ring-white/15 hover:bg-white/15"
      }`}
    >
      {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </button>
  );
}

/** True when a draft counts as an answer, mirroring the server's rule. */
export function isAnswered(question: AlbertQuestion, draft: DraftAnswer) {
  if (question.type === "text") return draft.text.trim().length > 0;
  return draft.choices.length > 0 || (draft.otherOn && draft.other.trim().length > 0);
}
