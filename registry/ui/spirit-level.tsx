"use client";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./spirit-level.css";

export type SpiritLevelProps = Omit<ComponentProps<"div">, "children"> & {
  /** Tilt in degrees: negative leans left, positive leans right. */
  value: number;
  /** Tilt at which the bubble reaches the end of the tube. */
  max?: number;
  /** Tilt within which the surface counts as level. */
  tolerance?: number;
  label?: string;
};

/**
 * A carpenter's level. The bubble drifts to the high side and settles with one small overshoot; inside the
 * tolerance the tube takes the success colour and reads "Level". The reading is written beside the tube and
 * exposed as a meter, so the bubble is never the only carrier. Under reduced motion the bubble moves without
 * easing.
 */
export function SpiritLevel({ value, max = 10, tolerance = 0.5, label = "Level", className, style, ...props }: SpiritLevelProps) {
  const clamped = Math.max(-max, Math.min(max, value));
  const low = 0 - max;
  const level = Math.abs(value) <= tolerance;
  const text = level ? "Level" : `${Math.abs(value).toFixed(1)}° ${value > 0 ? "right" : "left"}`;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={low}
      aria-valuemax={max}
      aria-valuenow={clamped}
      aria-valuetext={level ? "Level" : `${Math.abs(value).toFixed(1)} degrees ${value > 0 ? "right" : "left"}`}
      data-slot="spirit-level"
      data-level={level ? "" : undefined}
      className={cn("grid gap-2", className)}
      style={{ "--spl-x": clamped / max, ...style } as CSSProperties}
      {...props}
    >
      <span data-slot="spl-tube" aria-hidden="true">
        <i data-slot="spl-mark" />
        <i data-slot="spl-mark" />
        <i data-slot="spl-bubble" />
      </span>
      <span data-slot="spl-read" aria-hidden="true">
        {text}
      </span>
    </div>
  );
}
