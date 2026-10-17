"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "./lib/cn";
import "./rating.css";

const STAR = "M12 2.6l2.83 5.9 6.47.84-4.74 4.5 1.2 6.43L12 17.17l-5.76 3.1 1.2-6.43-4.74-4.5 6.47-.84z";

function Star({ fill }: { fill: "full" | "half" | "empty" }) {
  return (
    <span data-slot="rating-glyph" data-fill={fill} aria-hidden="true">
      <svg viewBox="0 0 24 24" data-layer="track"><path d={STAR} /></svg>
      <svg viewBox="0 0 24 24" data-layer="fill"><path d={STAR} /></svg>
    </span>
  );
}

const fillOf = (shown: number, index: number) => (shown >= index ? "full" : shown >= index - 0.5 ? "half" : "empty");
const roundHalf = (value: number) => Math.round(value * 2) / 2;
const formatValue = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

export type RatingProps = {
  /** Names the group, e.g. "Rate this recipe". Shown as the legend unless `hideLabel`. */
  label: string;
  hideLabel?: boolean;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Number of stars. */
  max?: number;
  /** 0.5 allows half stars. */
  step?: 1 | 0.5;
  /** Submitted with the form. */
  name?: string;
  disabled?: boolean;
  /** Display only: one image with the value in words, e.g. a product's average. */
  readOnly?: boolean;
  /** A word for each whole star, shown beside the stars, e.g. ["Poor", "Fair", "Good", "Great", "Loved it"]. */
  labels?: readonly string[];
  /** Choosing the current value again, or Delete, clears it. */
  clearable?: boolean;
  /** Read-only: how many ratings the average comes from. */
  count?: number;
  /** Read-only: show the number after the stars. */
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * Stars that work as a native radio group: arrows change the value, the
 * chosen star settles in, a pointer previews before you choose, and the
 * value posts with the form. Read-only, it is one image that says the
 * average and how many ratings it comes from.
 */
export function Rating({
  label,
  hideLabel = false,
  value: controlled,
  defaultValue = 0,
  onValueChange,
  max = 5,
  step = 1,
  name,
  disabled,
  readOnly = false,
  labels,
  clearable = true,
  count,
  showValue = true,
  size = "md",
  className,
}: RatingProps) {
  const groupName = useId();
  const [inner, setInner] = useState(defaultValue);
  const [hover, setHover] = useState<number | null>(null);
  const [pop, setPop] = useState({ star: 0, n: 0 });
  const value = controlled ?? inner;
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const wordFor = (v: number) => (labels && v > 0 ? labels[Math.min(labels.length, Math.ceil(v)) - 1] : undefined);

  if (readOnly) {
    const shown = roundHalf(value);
    const spoken = `Rated ${formatValue(Math.round(value * 10) / 10)} out of ${max}${count !== undefined ? `, from ${count.toLocaleString("en-US")} ratings` : ""}`;
    return (
      <span data-slot="rating" data-readonly="" data-size={size} role="img" aria-label={spoken} className={cn("inline-flex items-center gap-1.5", className)}>
        <span data-slot="rating-stars" aria-hidden="true">
          {stars.map((star) => (
            <span key={star} data-slot="rating-star">
              <Star fill={fillOf(shown, star)} />
            </span>
          ))}
        </span>
        {showValue && <span data-slot="rating-value" aria-hidden="true">{formatValue(Math.round(value * 10) / 10)}</span>}
        {count !== undefined && <span data-slot="rating-count" aria-hidden="true">({count.toLocaleString("en-US")})</span>}
      </span>
    );
  }

  function choose(next: number, star: number) {
    const resolved = clearable && next === value ? 0 : next;
    if (controlled === undefined) setInner(resolved);
    onValueChange?.(resolved);
    if (resolved) setPop((current) => ({ star, n: current.n + 1 }));
  }

  function clear(event: KeyboardEvent) {
    if (!clearable || (event.key !== "Backspace" && event.key !== "Delete")) return;
    event.preventDefault();
    if (controlled === undefined) setInner(0);
    onValueChange?.(0);
  }

  const shown = hover ?? value;
  const word = wordFor(shown);
  const options = (star: number) => (step === 0.5 ? [star - 0.5, star] : [star]);

  return (
    <fieldset data-slot="rating" data-size={size} disabled={disabled} className={cn("m-0 min-w-0 border-0 p-0", className)}>
      <legend className={cn("mb-1.5 p-0 text-sm font-medium", hideLabel && "sr-only")}>{label}</legend>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div data-slot="rating-stars" onPointerLeave={() => setHover(null)}>
          {stars.map((star) => (
            <span key={star} data-slot="rating-star" data-half={step === 0.5 || undefined}>
              <span key={pop.star === star ? pop.n : 0} data-slot="rating-settle" data-pop={pop.star === star && pop.n > 0 ? "" : undefined}>
                <Star fill={fillOf(shown, star)} />
              </span>
              {options(star).map((option) => (
                <input
                  key={option}
                  type="radio"
                  name={name ?? groupName}
                  value={option}
                  checked={value === option}
                  data-side={step === 0.5 ? (option === star ? "end" : "start") : undefined}
                  aria-label={`${formatValue(option)} of ${max} stars${wordFor(option) ? `, ${wordFor(option)}` : ""}`}
                  onChange={() => choose(option, star)}
                  onClick={(event) => {
                    // A click on the already chosen star fires no change event: clear it here.
                    if (value === option && event.detail > 0) choose(option, star);
                  }}
                  onKeyDown={clear}
                  onPointerEnter={(event) => event.pointerType === "mouse" && setHover(option)}
                />
              ))}
            </span>
          ))}
        </div>
        {/* Each radio already says its word; this line is for the eye, and previews under the pointer. */}
        <span data-slot="rating-word" data-preview={hover !== null || undefined} aria-hidden="true">
          {word ?? (value > 0 ? `${formatValue(value)} of ${max}` : "Not rated")}
        </span>
      </div>
    </fieldset>
  );
}
