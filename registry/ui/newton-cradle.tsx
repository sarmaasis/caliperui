"use client";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./newton-cradle.css";

export type NewtonCradleProps = Omit<ComponentProps<"div">, "children"> & {
  /** Names what is happening, e.g. "Syncing". Pass "" when a visible label sits beside it. */
  label?: string;
  /** Balls in the row, 3 to 7. */
  balls?: number;
  /** Holds the balls at rest. */
  paused?: boolean;
  size?: "sm" | "md" | "lg";
};

/**
 * A desk cradle as a loading indicator: the end ball swings out and falls back, the row passes the knock along
 * and the ball at the other end swings out in turn. One cycle takes 1.4 seconds with the swing slowing at the
 * top and quickening through the bottom, as a pendulum does. It reads as "working, and it will take a moment"
 * more calmly than a spinner. Under reduced motion the balls hold still with one raised.
 */
export function NewtonCradle({ label = "Loading", balls = 5, paused, size = "md", className, style, ...props }: NewtonCradleProps) {
  const count = Math.max(3, Math.min(7, Math.round(balls)));
  return (
    <div
      role={label ? "status" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      data-slot="newton-cradle"
      data-size={size}
      data-paused={paused ? "" : undefined}
      className={cn("inline-grid", className)}
      style={style}
      {...props}
    >
      <span data-slot="nc-frame" style={{ "--nc-n": count } as CSSProperties}>
        {Array.from({ length: count }, (_, index) => (
          <i key={index} data-slot="nc-ball" data-end={index === 0 ? "left" : index === count - 1 ? "right" : undefined} />
        ))}
      </span>
    </div>
  );
}
