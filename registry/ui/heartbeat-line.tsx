"use client";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./heartbeat-line.css";

export type HeartbeatLineProps = Omit<ComponentProps<"div">, "children"> & {
  /** Beats per minute; the trace scrolls at exactly this rate. */
  bpm?: number;
  /** Steady is the normal trace, alert turns red and runs as given, flatline draws a still line. */
  status?: "steady" | "alert" | "flatline";
  /** Names what is measured, e.g. "Heart rate". */
  label?: string;
  /** Shows the rate as a figure beside the trace. */
  showRate?: boolean;
};

const BEAT = 120;
const VISIBLE = 3;
// One beat of a trace: a small P wave, the sharp QRS spike, then a rounded T wave, on a baseline at y = 40.
const beat = (x: number) =>
  `H${x + 24} q5 -9 10 0 H${x + 50} L${x + 54} 46 L${x + 60} 6 L${x + 66} 68 L${x + 70} 40 H${x + 84} q8 -14 16 0 H${x + BEAT}`;
const trace = `M0 40 ${Array.from({ length: VISIBLE * 2 }, (_, index) => beat(index * BEAT)).join(" ")}`;

/**
 * A live monitor trace: a heart-rate line, a server's request pulse, a device's check-in. The trace scrolls past
 * a fixed edge at the true rate, so a faster rate really is a faster line, and fades in and out at its ends.
 * Alert turns it red; flatline stops the scroll and draws a level line. The rate and status are read as text;
 * the drawing is decoration. Under reduced motion the trace holds still.
 */
export function HeartbeatLine({ bpm = 72, status = "steady", label = "Heart rate", showRate = true, className, style, ...props }: HeartbeatLineProps) {
  const rate = Math.max(20, Math.min(220, bpm));
  const period = ((60 / rate) * VISIBLE).toFixed(3);
  return (
    <div
      data-slot="heartbeat-line"
      data-status={status}
      className={cn("inline-flex items-center gap-3", className)}
      style={{ "--hbl-period": `${period}s`, ...style } as CSSProperties}
      {...props}
    >
      <svg data-slot="hbl-trace" viewBox={`0 0 ${BEAT * VISIBLE} 80`} preserveAspectRatio="none" aria-hidden="true">
        <g data-slot="hbl-scroll">
          <path d={trace} />
        </g>
        <path data-slot="hbl-flat" d={`M0 40 H${BEAT * VISIBLE}`} />
      </svg>
      {showRate && (
        <span data-slot="hbl-rate">
          <b className="tabular-nums">{status === "flatline" ? "0" : Math.round(rate)}</b>
          <small>bpm</small>
        </span>
      )}
      <span className="sr-only" role="status">
        {label}: {status === "flatline" ? "no signal" : `${Math.round(rate)} beats per minute${status === "alert" ? ", alert" : ""}`}
      </span>
    </div>
  );
}
