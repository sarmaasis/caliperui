"use client";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./status-icon.css";

export type IssueStatus = "backlog" | "todo" | "in-progress" | "in-review" | "done" | "cancelled";

export type StatusIconProps = Omit<ComponentProps<"svg">, "children"> & {
  status: IssueStatus;
  /** How far an in-progress item is, 0 to 1. In review always shows three quarters. */
  progress?: number;
  /** Size in px. */
  size?: number;
  /** Read instead of the status name. Pass an empty string when a visible label already says it. */
  label?: string;
};

const NAMES: Record<IssueStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  "in-progress": "In progress",
  "in-review": "In review",
  done: "Done",
  cancelled: "Cancelled",
};

const PIE = 2 * Math.PI * 2.5; // circumference of the pie's stroke centre (r 2.5, stroke 5 fills radius 5)

/**
 * The small status glyph beside a task: a dashed ring for backlog, an open ring for todo, a ring filling like a pie
 * while in progress and review, a filled disc with a tick when done and a crossed disc when cancelled. Every state
 * is the same few shapes, so a change of status animates from one to the next instead of swapping pictures.
 */
export function StatusIcon({ status, progress = 0.5, size = 16, label, className, style, ...props }: StatusIconProps) {
  const fill = status === "in-progress" ? Math.min(1, Math.max(0.08, progress)) : status === "in-review" ? 0.75 : 0;
  const name = label ?? NAMES[status];
  return (
    <svg
      data-slot="status-icon"
      data-status={status}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ "--si-pie": `${(fill * PIE).toFixed(2)}px`, ...style } as CSSProperties}
      {...(name ? { role: "img", "aria-label": name } : { "aria-hidden": true })}
      {...props}
    >
      <circle data-slot="si-ring" cx="8" cy="8" r="6.25" pathLength={40} fill="none" strokeWidth="1.5" />
      <circle data-slot="si-pie" cx="8" cy="8" r="2.5" fill="none" strokeWidth="5" />
      <circle data-slot="si-disc" cx="8" cy="8" r="7" />
      <path data-slot="si-mark" d={status === "cancelled" ? "M5.75 5.75l4.5 4.5M10.25 5.75l-4.5 4.5" : "M5 8.25l2 2 4-4.25"} pathLength={1} fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
