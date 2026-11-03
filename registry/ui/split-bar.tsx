"use client";
import { useState, type ComponentProps, type CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./split-bar.css";

export type SplitBarSegment = { id: string; label: string; value: number };

export type SplitBarProps = Omit<ComponentProps<"div">, "children"> & {
  /** Names the whole, e.g. "Revenue by plan". */
  label: string;
  segments: SplitBarSegment[];
  /** Formats a segment's own value for the readout. */
  format?: (value: number) => string;
};

const percent = (value: number, total: number) => (total ? Math.round((value / total) * 1000) / 10 : 0);

/**
 * One bar that is the whole, split into shares in the chart colours. Rest on a share, or focus its legend row, and it
 * widens to show its exact figures while the rest make room; switch shares off in the legend and the others spring
 * to fill the bar, with their percentages of what is left. Under reduced motion the widths change without the glide.
 */
export function SplitBar({ label, segments, format = (value) => value.toLocaleString("en-US"), className, ...props }: SplitBarProps) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [active, setActive] = useState<string | null>(null);
  const shown = segments.filter((segment) => !hidden.has(segment.id));
  const total = shown.reduce((sum, segment) => sum + segment.value, 0);
  const focus = shown.find((segment) => segment.id === active);

  const toggle = (id: string) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (shown.length > 1) next.add(id); // the bar always keeps one share
      return next;
    });

  return (
    <div data-slot="split-bar" className={cn("grid gap-3", className)} {...props}>
      <div data-slot="sb-readout" aria-live="polite" className="flex min-h-6 items-baseline justify-between gap-3 text-sm">
        {focus ? (
          <>
            <span className="truncate font-medium">{focus.label}</span>
            <span className="shrink-0 tabular-nums">
              {format(focus.value)} <span className="text-muted-foreground">· {percent(focus.value, total)}%</span>
            </span>
          </>
        ) : (
          <>
            <span className="truncate text-muted-foreground">{label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{format(total)}</span>
          </>
        )}
      </div>
      <div data-slot="sb-bar" role="img" aria-label={`${label}: ${shown.map((segment) => `${segment.label} ${percent(segment.value, total)}%`).join(", ")}`} data-focused={focus ? "" : undefined}>
        {segments.map((segment, index) => {
          const off = hidden.has(segment.id);
          // The focused share takes an eighth of the bar on top of its own size, so even a sliver opens up to read.
          const grow = off ? 0 : segment.value + (segment.id === active ? total * 0.12 : 0);
          return (
            <span
              key={segment.id}
              data-slot="sb-segment"
              data-active={segment.id === active ? "" : undefined}
              data-off={off ? "" : undefined}
              style={{ flexGrow: grow, "--sb-color": `var(--chart-${(index % 6) + 1})` } as CSSProperties}
              onPointerEnter={() => setActive(segment.id)}
              onPointerLeave={() => setActive(null)}
            >
              <span data-slot="sb-share">{percent(segment.value, total)}%</span>
            </span>
          );
        })}
      </div>
      <ul data-slot="sb-legend" aria-label={`${label} shares`} className="flex flex-wrap gap-x-1 gap-y-1">
        {segments.map((segment, index) => {
          const off = hidden.has(segment.id);
          return (
            <li key={segment.id}>
              <button
                type="button"
                data-slot="sb-key"
                aria-pressed={!off}
                aria-disabled={!off && shown.length === 1 ? true : undefined}
                style={{ "--sb-color": `var(--chart-${(index % 6) + 1})` } as CSSProperties}
                onClick={() => toggle(segment.id)}
                onPointerEnter={() => !off && setActive(segment.id)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => !off && setActive(segment.id)}
                onBlur={() => setActive(null)}
              >
                <span data-slot="sb-swatch" aria-hidden="true" />
                {segment.label}
                <span className="tabular-nums text-muted-foreground">{off ? "Off" : `${percent(segment.value, total)}%`}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
