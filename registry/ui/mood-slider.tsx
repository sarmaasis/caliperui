"use client";
import { useId, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from "react";
import { cn } from "./lib/cn";
import "./mood-slider.css";

export type MoodSliderProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** The question, e.g. "How was your onboarding?". */
  label: string;
  /** One word per step, worst first. */
  moods?: string[];
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
};

/**
 * A satisfaction rating as a face that changes with the slider: the mouth bends from a frown to a smile, the eyes
 * soften, and the colour warms from red through amber to green, with the word for each step beneath. Dragging is
 * continuous and lands on the nearest step; arrow keys move a step at a time. Under reduced motion the face changes
 * without easing between steps.
 */
export function MoodSlider({ label, moods = ["Awful", "Poor", "Okay", "Good", "Great"], value, defaultValue = 2, onValueChange, className, style, ...props }: MoodSliderProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultValue);
  const [drag, setDrag] = useState<number | null>(null);
  const step = value ?? own;
  const at = drag ?? step; // continuous while dragging
  const last = moods.length - 1;
  const t = last ? at / last : 0; // 0 worst, 1 best

  const commit = (next: number) => {
    const snapped = Math.max(0, Math.min(last, Math.round(next)));
    setDrag(null);
    if (value === undefined) setOwn(snapped);
    if (snapped !== step) onValueChange?.(snapped);
  };
  const key = (event: KeyboardEvent<HTMLInputElement>) => {
    const move = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, Home: -last, End: last }[event.key];
    if (move === undefined) return;
    event.preventDefault();
    commit(step + move);
  };

  // The mouth is one curve: its middle drops below the corners for a frown and rises above for a smile.
  const bend = (t - 0.5) * 22;
  const mouth = `M30 ${66 - bend * 0.3} Q50 ${66 + bend} 70 ${66 - bend * 0.3}`;
  const eye = 6 - Math.max(0, t - 0.6) * 6; // happier eyes narrow into a smile

  return (
    <div data-slot="mood-slider" className={cn("grid justify-items-center gap-4", className)} style={{ "--mo-h": 25 + t * 120, ...style } as CSSProperties} {...props}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <svg data-slot="mo-face" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx={50} cy={50} r={46} data-slot="mo-skin" />
        <ellipse cx={36} cy={42} rx={5} ry={eye} data-slot="mo-feature" />
        <ellipse cx={64} cy={42} rx={5} ry={eye} data-slot="mo-feature" />
        <path d={mouth} data-slot="mo-mouth" />
      </svg>
      <p data-slot="mo-word" aria-hidden="true">
        <span key={Math.round(at)}>{moods[Math.round(at)]}</span>
      </p>
      <input
        id={id}
        type="range"
        data-slot="mo-range"
        min={0}
        max={last}
        step="any"
        value={at}
        aria-valuetext={moods[Math.round(at)]}
        onChange={(event) => setDrag(Number(event.target.value))}
        onPointerUp={() => drag !== null && commit(drag)}
        onKeyDown={key}
        onBlur={() => drag !== null && commit(drag)}
      />
    </div>
  );
}
