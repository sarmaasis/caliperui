"use client";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./equalizer-bars.css";

export type EqualizerBarsProps = Omit<ComponentProps<"span">, "children"> & {
  /** Bars bounce while true and settle low when false. */
  playing?: boolean;
  bars?: 3 | 4 | 5;
  /** Read instead of "Playing" or "Paused". Pass an empty string when the row already says it. */
  label?: string;
};

/**
 * The small bouncing bars that mark what is playing in a list of tracks. Each bar keeps its own tempo so they never
 * line up; pausing settles them low and still. Under reduced motion the bars stand at rest heights.
 */
export function EqualizerBars({ playing = true, bars = 4, label, className, ...props }: EqualizerBarsProps) {
  const name = label ?? (playing ? "Playing" : "Paused");
  return (
    <span
      data-slot="equalizer-bars"
      data-playing={playing ? "" : undefined}
      className={cn("inline-flex h-3.5 items-end gap-[2px]", className)}
      {...(name ? { role: "img", "aria-label": name } : { "aria-hidden": true })}
      {...props}
    >
      {Array.from({ length: bars }, (_, i) => (
        <i key={i} style={{ "--eq-i": i } as CSSProperties} />
      ))}
    </span>
  );
}
