"use client";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./char-counter.css";

export type CharCounterProps = Omit<ComponentProps<"span">, "children"> & {
  /** How many characters are in the field. Pass the string's length. */
  length: number;
  /** The most the field allows. */
  max: number;
  /** The share of the limit at which the ring warns and the figure appears. */
  warnAt?: number;
};

/**
 * A character counter for a text box, drawn as a ring that fills as you type. It stays quiet and small until
 * you near the limit, when it turns amber and shows how many are left; past the limit it turns red and shows
 * how many are over, with one small nudge. Screen readers hear nothing while typing; they are told once when
 * the limit is near and once when it is passed. Link it to the field with `aria-describedby` on the field.
 * Under reduced motion the ring and figure change without moving.
 */
export function CharCounter({ length, max, warnAt = 0.85, className, ...props }: CharCounterProps) {
  const share = max > 0 ? length / max : 0;
  const state = length > max ? "over" : share >= warnAt ? "near" : "ok";
  const left = max - length;
  const [spoken, setSpoken] = useState("");
  const last = useRef(state);

  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    setSpoken(state === "over" ? `${-left} characters over the limit` : state === "near" ? `${left} characters left` : "");
  }, [state, left]);

  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(1, share) * circumference;
  return (
    <span data-slot="char-counter" data-state={state} className={cn("inline-flex items-center gap-2", className)} {...props}>
      <svg data-slot="chc-ring" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r={radius} data-slot="chc-track" />
        <circle cx="10" cy="10" r={radius} data-slot="chc-fill" strokeDasharray={`${filled} ${circumference}`} />
      </svg>
      {state !== "ok" && (
        <span data-slot="chc-figure" key={state} className="tabular-nums" aria-hidden="true">
          {left}
        </span>
      )}
      <span className="sr-only" role="status">
        {spoken}
      </span>
    </span>
  );
}
