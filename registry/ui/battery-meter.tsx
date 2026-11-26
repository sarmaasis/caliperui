"use client";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./battery-meter.css";

export type BatteryMeterProps = Omit<ComponentProps<"div">, "children"> & {
  /** Charge from 0 to 100. */
  level: number;
  charging?: boolean;
  /** Writes the percentage beside the cell. */
  showValue?: boolean;
  /** What the battery belongs to, e.g. "Sensor battery". */
  label?: string;
};

/**
 * A battery cell that fills and drains with the level. It stays in the foreground colour until 20%, turns amber
 * at 20% and red at 10%, and while charging a soft light sweeps across the fill and a bolt appears. The level is
 * exposed as a meter with the percentage and charging state in its value text. Under reduced motion the sweep
 * stops and the fill changes without easing.
 */
export function BatteryMeter({ level, charging, showValue = true, label = "Battery", className, style, ...props }: BatteryMeterProps) {
  const value = Math.max(0, Math.min(100, Math.round(level)));
  const tone = value <= 10 ? "critical" : value <= 20 ? "low" : "ok";
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value}%${charging ? ", charging" : ""}`}
      data-slot="battery-meter"
      data-tone={tone}
      data-charging={charging ? "" : undefined}
      className={cn("inline-flex items-center gap-2", className)}
      style={{ "--bat-level": value / 100, ...style } as CSSProperties}
      {...props}
    >
      <span data-slot="bat-body" aria-hidden="true">
        <span data-slot="bat-cell">
          <span data-slot="bat-fill" />
        </span>
      </span>
      {charging ? (
        <svg data-slot="bat-bolt" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13 2 5 13.5h5.5L9.5 22 19 9.5h-6z" />
        </svg>
      ) : null}
      {showValue ? (
        <span data-slot="bat-value" aria-hidden="true">
          {value}%
        </span>
      ) : null}
    </div>
  );
}
