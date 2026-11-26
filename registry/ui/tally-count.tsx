"use client";
import type { ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./tally-count.css";

export type TallyCountProps = Omit<ComponentProps<"div">, "children"> & {
  count: number;
  /** Names what is counted, e.g. "days without an incident". */
  label?: string;
};

const strokes = [
  "M6 4 6 28",
  "M13 4 13 28",
  "M20 4 20 28",
  "M27 4 27 28",
  "M1 24 32 8",
];

/**
 * A count kept as tally marks: four strokes and a slash across them make a gate of five, and gates line up and
 * wrap. Each mark is drawn in as the count rises and drawn back out as it falls. The count is exposed as an
 * image named with the number and the label, so it reads as text where it matters. Under reduced motion the marks
 * appear without being drawn.
 */
export function TallyCount({ count, label = "counted", className, ...props }: TallyCountProps) {
  const total = Math.max(0, Math.round(count));
  const groups = Math.max(1, Math.ceil(total / 5));
  return (
    <div role="img" aria-label={`${total} ${label}`} data-slot="tally-count" className={cn("flex flex-wrap gap-x-3 gap-y-2", className)} {...props}>
      {Array.from({ length: groups }, (_, group) => (
        <svg key={group} data-slot="tly-gate" viewBox="0 0 34 32" aria-hidden="true">
          {strokes.map((d, index) => (
            <path key={d} d={d} pathLength={1} data-slot="tly-mark" data-slash={index === 4 ? "" : undefined} data-on={group * 5 + index < total ? "" : undefined} />
          ))}
        </svg>
      ))}
    </div>
  );
}
