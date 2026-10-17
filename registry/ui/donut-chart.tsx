"use client";
import { useState } from "react";
import { AnimatedCounter } from "./animated-counter";
import {
  ChartTable,
  ChartMessage,
  chartColor,
  legendKeys,
  numberText,
  useChartReveal,
  type ChartPart,
} from "./chart-parts";
import { cn } from "./lib/cn";
import "./shared/styles.css";
import "./donut-chart.css";
export function DonutChart({
  label,
  data,
  unit = "",
  className,
  loading,
  error,
}: {
  label: string;
  data: readonly ChartPart[];
  unit?: string;
  className?: string;
  loading?: boolean;
  error?: string;
}) {
  const root = useChartReveal();
  const [hidden, setHidden] = useState<string[]>([]),
    [preview, setPreview] = useState<string | null>(null),
    [pinned, setPinned] = useState<string | null>(null);
  const positive = data.filter(
    (item) => Number.isFinite(item.value) && item.value > 0,
  );
  const whole = positive.reduce((sum, item) => sum + item.value, 0);
  const sorted = [...positive].sort((a, b) => b.value - a.value);
  const small = sorted.filter(
    (item, index) => index >= 5 || item.value / whole < 0.035,
  );
  const grouped = small.length > 1;
  const parts = grouped
    ? [
        ...positive.filter((item) => !small.includes(item)),
        {
          id: "__other",
          label: "Other",
          value: small.reduce((sum, item) => sum + item.value, 0),
        },
      ]
    : positive;
  const total = parts
    .filter((item) => !hidden.includes(item.id))
    .reduce((sum, item) => sum + item.value, 0);
  const active = parts.find(
    (item) => item.id === (preview ?? pinned) && !hidden.includes(item.id),
  );
  return (
    <figure
      ref={root}
      aria-label={label}
      aria-busy={loading}
      data-slot="donut-chart"
      className={cn("min-w-0", className)}
    >
      <figcaption className="mb-4 text-sm font-medium">{label}</figcaption>
      <ChartMessage loading={loading} error={error} empty={!parts.length} />
      {!error && !!parts.length && (
        <div data-slot="donut-layout">
          <div className="relative mx-auto w-52 max-w-full">
            <svg
              aria-hidden="true"
              viewBox="0 0 200 200"
              className="w-full -rotate-90"
            >
              <circle
                cx="100"
                cy="100"
                r="78"
                fill="none"
                stroke="var(--muted)"
                strokeWidth="20"
              />
              {parts.map((item, index) => {
                const share =
                  hidden.includes(item.id) || !total
                    ? 0
                    : (item.value / total) * 100;
                const offset = parts.slice(0, index).reduce((sum, part) => sum + (hidden.includes(part.id) || !total ? 0 : part.value / total * 100), 0);
                const angle = ((offset + share / 2) / 100) * Math.PI * 2;
                return (
                  <circle
                    key={item.id}
                    data-slot="donut-segment"
                    cx="100"
                    cy="100"
                    r="78"
                    fill="none"
                    stroke={item.color ?? chartColor(index)}
                    strokeWidth={active?.id === item.id ? 24 : 20}
                    pathLength="100"
                    strokeDasharray={`${Math.max(0, share - 0.7)} ${100 - Math.max(0, share - 0.7)}`}
                    strokeDashoffset={-offset}
                    style={{
                      opacity: active && active.id !== item.id ? 0.35 : 1,
                      transform:
                        active?.id === item.id
                          ? `translate(${Math.cos(angle) * 3}px,${Math.sin(angle) * 3}px)`
                          : "translate(0,0)",
                    }}
                    onPointerEnter={() => setPreview(item.id)}
                    onPointerLeave={() => setPreview(null)}
                    onClick={() =>
                      setPinned(pinned === item.id ? null : item.id)
                    }
                  />
                );
              })}
            </svg>
            <div
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
              aria-hidden="true"
            >
              <span className="max-w-32 truncate text-xs text-muted-foreground">
                {active?.label ?? "Total"}
              </span>
              <AnimatedCounter
                value={active?.value ?? total}
                className="mt-1 text-2xl tracking-tight"
              />
              <span className="mt-1 text-xs text-muted-foreground">
                {active
                  ? `${Math.round((active.value / (total || 1)) * 100)}%`
                  : unit}
              </span>
              {!total && (
                <span className="mt-1 text-xs text-muted-foreground">
                  All hidden
                </span>
              )}
            </div>
          </div>
          <div
            role="group"
            aria-label={`${label} categories`}
            className="grid content-center gap-1"
            onKeyDown={(event) => {
              legendKeys(event);
              if (event.key === "Escape") {
                setPinned(null);
                setPreview(null);
              }
            }}
          >
            {parts.map((item, index) => (
              <div key={item.id} className="flex items-center gap-1">
                <button
                  type="button"
                  data-slot="donut-legend"
                  aria-pressed={!hidden.includes(item.id)}
                  aria-label={`${item.label}, ${numberText(item.value)} ${unit}, ${Math.round((item.value / whole) * 100)} percent${item.id === "__other" ? `, includes ${small.map((part) => part.label).join(", ")}` : ""}`}
                  onClick={() =>
                    setHidden(
                      hidden.includes(item.id)
                        ? hidden.filter((key) => key !== item.id)
                        : [...hidden, item.id],
                    )
                  }
                  onFocus={() => setPreview(item.id)}
                  onBlur={() => setPreview(null)}
                  onPointerEnter={() => setPreview(item.id)}
                  onPointerLeave={() => setPreview(null)}
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-control px-2 text-left text-xs outline-none hover:bg-muted focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: item.color ?? chartColor(index) }}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <strong className="font-medium tabular-nums">
                    {numberText(item.value)}
                  </strong>
                  <span className="w-8 text-right tabular-nums text-muted-foreground">
                    {Math.round((item.value / whole) * 100)}%
                  </span>
                </button>
                <button
                  type="button"
                  className="caliper-icon-button text-xs"
                  aria-label={`Pin ${item.label}`}
                  aria-pressed={pinned === item.id}
                  onClick={() => setPinned(pinned === item.id ? null : item.id)}
                >
                  ⌖
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="sr-only" role="status">
        {label}. Visible total {numberText(total)} {unit}.
        {active ? ` ${active.label}: ${numberText(active.value)}.` : ""}
      </p>
      <ChartTable
        label={label}
        headers={["Category", "Value", "Share"]}
        rows={positive.map((item) => [
          item.label,
          item.value,
          `${Math.round((item.value / (whole || 1)) * 100)}%`,
        ])}
      />
    </figure>
  );
}
