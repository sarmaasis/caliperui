"use client";
import { useId, type ComponentProps, type CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./wavy-progress.css";

export type WavyProgressProps = Omit<ComponentProps<"div">, "children"> & {
  /** Amount done. Leave it out while the amount is unknown. */
  value?: number;
  max?: number;
  /** A bar across its container, or a ring. */
  variant?: "linear" | "circular";
  /** Diameter of the ring in px. */
  size?: number;
  /** Names the progress for assistive technology. */
  label: string;
  /** Shows the percentage beside the bar or inside the ring. */
  showValue?: boolean;
};

// One ring of `waves` crests around radius r, as a closed path.
function ringPath(r: number, amplitude: number, waves: number, c: number) {
  const steps = waves * 12;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const rr = r + amplitude * Math.sin(a * waves);
    d += `${i ? "L" : "M"}${(c + rr * Math.cos(a)).toFixed(2)} ${(c + rr * Math.sin(a)).toFixed(2)}`;
  }
  return `${d}Z`;
}

/**
 * Progress drawn as a travelling wave: the done part ripples, the rest is a flat track ending in a stop mark. The wave
 * lies flat once the work is done, and under reduced motion it is a plain bar or ring. Without a value it runs as an
 * indeterminate sweep.
 */
export function WavyProgress({ value, max = 100, variant = "linear", size = 48, label, showValue = false, className, style, ...props }: WavyProgressProps) {
  const id = useId();
  const known = value !== undefined;
  const pct = known ? Math.min(100, Math.max(0, (value / max) * 100)) : 30;
  const done = known && pct >= 100;
  const text = `${Math.round(pct)}%`;
  const a11y = {
    role: "progressbar",
    "aria-label": label,
    "aria-valuemin": 0,
    "aria-valuemax": max,
    ...(known ? { "aria-valuenow": value, "aria-valuetext": text } : {}),
  } as const;

  if (variant === "circular") {
    const c = size / 2;
    const stroke = Math.max(2.5, size / 16);
    const r = c - stroke - 2;
    // About one crest every 9px of circumference, low enough to read as a ripple on the ring.
    const waves = Math.max(8, Math.round((2 * Math.PI * r) / 9));
    return (
      <div
        data-slot="wavy-progress"
        data-variant="circular"
        data-indeterminate={known ? undefined : ""}
        data-done={done ? "" : undefined}
        className={cn("relative inline-grid place-items-center", className)}
        style={{ width: size, height: size, ...style }}
        {...a11y}
        {...props}
      >
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
          <mask id={`${id}-arc`}>
            <circle data-slot="wv-arc" cx={c} cy={c} r={r} pathLength={100} fill="none" stroke="#fff" strokeWidth={stroke * 4} strokeDasharray={`${pct} 100`} style={{ transformOrigin: "center" }} />
          </mask>
          <circle data-slot="wv-track" cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} pathLength={100} strokeDasharray={known ? `0 ${pct + 4} ${Math.max(0, 92 - pct)} 100` : undefined} />
          <g mask={`url(#${id}-arc)`}>
            <path data-slot="wv-wave" d={ringPath(r, stroke * 0.42, waves, c)} fill="none" strokeWidth={stroke} style={{ transformOrigin: "center" }} />
            <circle data-slot="wv-flat" cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} />
          </g>
        </svg>
        {showValue && known && <span data-slot="wv-value" className="absolute text-[11px] font-medium tabular-nums">{text}</span>}
      </div>
    );
  }

  return (
    <div
      data-slot="wavy-progress"
      data-variant="linear"
      data-indeterminate={known ? undefined : ""}
      data-done={done ? "" : undefined}
      className={cn("flex w-full items-center gap-3", className)}
      style={{ "--wv-pct": `${pct}%`, ...style } as CSSProperties}
      {...a11y}
      {...props}
    >
      <span data-slot="wv-bar" className="relative h-3 min-w-0 flex-1" aria-hidden="true">
        <span data-slot="wv-fill">
          <span data-slot="wv-wave" />
          <span data-slot="wv-flat" />
        </span>
        <span data-slot="wv-rest" />
      </span>
      {showValue && known && <span data-slot="wv-value" className="w-9 text-right text-xs tabular-nums text-muted-foreground">{text}</span>}
    </div>
  );
}
