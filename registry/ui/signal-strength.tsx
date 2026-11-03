"use client";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./signal-strength.css";

export type SignalStrengthProps = Omit<ComponentProps<"span">, "children"> & {
  /** Bars lit, from 0 to 4. */
  level: number;
  /** Searching sweeps the bars; offline greys them out with a slash. */
  status?: "connected" | "searching" | "offline";
  /** What the signal is of, e.g. "Network". Pass "" when the row says it already. */
  label?: string;
  size?: "sm" | "md";
};

const quality = ["No signal", "Poor", "Fair", "Good", "Excellent"];

/**
 * Four bars for the quality of a connection: a call, a sync, a device's network. The bars rise and fall one after
 * another as the level changes and take a colour for how good it is (red poor, amber fair, green good); while
 * searching a light sweeps across them, and offline they grey out under a slash. Under reduced motion the bars
 * change without rising and the sweep is replaced by a dim pulse.
 */
export function SignalStrength({ level, status = "connected", label = "Signal", size = "md", className, style, ...props }: SignalStrengthProps) {
  const lit = status === "connected" ? Math.max(0, Math.min(4, Math.round(level))) : 0;
  const name = status === "connected" ? `${quality[lit]}, ${lit} of 4 bars` : status === "searching" ? "Searching" : "Offline";
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label ? `${label}: ${name}` : undefined}
      aria-hidden={label ? undefined : true}
      data-slot="signal-strength"
      data-status={status}
      data-level={lit}
      data-size={size}
      className={cn("inline-flex", className)}
      style={style}
      {...props}
    >
      {[1, 2, 3, 4].map((bar) => (
        <i key={bar} data-on={bar <= lit ? "" : undefined} style={{ "--ss-i": bar } as CSSProperties} />
      ))}
      {status === "offline" && <b data-slot="ss-slash" />}
    </span>
  );
}
