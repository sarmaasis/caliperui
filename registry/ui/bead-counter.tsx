"use client";
import { useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from "react";
import { cn } from "./lib/cn";
import "./bead-counter.css";

export type BeadCounterProps = Omit<ComponentProps<"div">, "children" | "onChange" | "defaultValue"> & {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Beads on the wire, 2 to 20. */
  max?: number;
  /** Names the count, e.g. "Guests". */
  label?: string;
};

/**
 * A counter that works like an abacus wire. Beads sit at the left; the count is how many have been slid to the
 * right, from the right-hand end. Press a bead on the left to slide it and every bead after it across; press a bead
 * on the right to slide it and the beads before it back. They clack over one after another, nearest the gap first.
 * The wire is a slider: arrow keys change the count by one, Home and End go to the ends. Under reduced motion the
 * beads move together without easing.
 */
export function BeadCounter({ value, defaultValue = 0, onValueChange, max = 8, label = "Count", className, style, ...props }: BeadCounterProps) {
  const [inner, setInner] = useState(defaultValue);
  const total = Math.max(2, Math.min(20, Math.round(max)));
  const current = Math.max(0, Math.min(total, value ?? inner));
  const set = (next: number) => {
    const clamped = Math.max(0, Math.min(total, next));
    if (value === undefined) setInner(clamped);
    if (clamped !== current) onValueChange?.(clamped);
  };
  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = { ArrowRight: current + 1, ArrowUp: current + 1, ArrowLeft: current - 1, ArrowDown: current - 1, Home: 0, End: total }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    set(next);
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      data-slot="bead-counter"
      className={cn("grid gap-2", className)}
      style={{ "--bdc-n": total, ...style } as CSSProperties}
      onKeyDown={key}
      {...props}
    >
      <span data-slot="bdc-wire">
        {Array.from({ length: total }, (_, index) => (
          <i
            key={index}
            data-slot="bdc-bead"
            data-slid={index >= total - current ? "" : undefined}
            style={{ "--bdc-delay": `${Math.abs(index - (total - current)) * 28}ms` } as CSSProperties}
            onClick={() => set(index < total - current ? total - index : total - index - 1)}
          />
        ))}
      </span>
      <span data-slot="bdc-read" aria-hidden="true">
        {current} of {total}
      </span>
    </div>
  );
}
