"use client";
import { useEffect, useRef, type ReactNode, type KeyboardEvent } from "react";
import { line, curveMonotoneX } from "d3-shape";
import "./shared/chip-option.css";
import "./chart-parts.css";
export type ChartSeries = { id: string; label: string; color?: string };
export type ChartDatum = {
  id: string;
  label: string;
  values: Record<string, number | undefined>;
  x?: number;
  event?: string;
};
export type ChartPart = {
  id: string;
  label: string;
  value: number;
  color?: string;
};
export const chartColor = (index: number) => `var(--chart-${(index % 6) + 1})`;
export const numberText = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
export function useChartReveal() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          element.dataset.visible = "true";
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return root;
}
export function ChartTable({
  label,
  headers,
  rows,
}: {
  label: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="sr-only"><table>
      <caption>{label}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, column) =>
              column === 0 ? (
                <th key={column} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={column}>{cell}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table></div>
  );
}
export function ChartMessage({
  loading,
  error,
  empty,
}: {
  loading?: boolean;
  error?: string;
  empty?: boolean;
}) {
  return error || empty ? (
    <p
      role="status"
      className="grid min-h-48 place-items-center text-sm text-muted-foreground"
    >
      {error ?? (loading ? "Loading chart…" : "No data for this range.")}
    </p>
  ) : loading ? (
    <p role="status" className="text-xs text-muted-foreground">
      Updating chart…
    </p>
  ) : null;
}
export function ChartLegend({
  series,
  hidden,
  onToggle,
  active,
  onActive,
}: {
  series: readonly ChartSeries[];
  hidden: readonly string[];
  onToggle: (id: string) => void;
  active?: string | null;
  onActive?: (id: string | null) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Chart series"
      className="flex flex-wrap gap-2"
      onKeyDown={(event) => legendKeys(event)}
    >
      {series.map((item, index) => (
        <button
          key={item.id}
          type="button"
          data-slot="chart-legend-item"
          aria-pressed={!hidden.includes(item.id)}
          onClick={() => onToggle(item.id)}
          onPointerEnter={() => onActive?.(item.id)}
          onPointerLeave={() => onActive?.(null)}
          onFocus={() => onActive?.(item.id)}
          onBlur={() => onActive?.(null)}
          data-active={active === item.id}
        >
          <span
            aria-hidden="true"
            style={{ background: item.color ?? chartColor(index) }}
            className="size-2 rounded-full"
          />
          {item.label}
        </button>
      ))}
    </div>
  );
}
export function legendKeys(event: KeyboardEvent<HTMLElement>) {
  const nodes = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
  ];
  const index = nodes.indexOf(document.activeElement as HTMLButtonElement);
  const target =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? nodes.length - 1
        : ["ArrowRight", "ArrowDown"].includes(event.key)
          ? (index + 1) % nodes.length
          : ["ArrowLeft", "ArrowUp"].includes(event.key)
            ? (index - 1 + nodes.length) % nodes.length
            : -1;
  if (target >= 0) {
    event.preventDefault();
    nodes[target]?.focus();
  }
}
export function pointKey(
  event: KeyboardEvent<HTMLElement>,
  active: number | null,
  length: number,
) {
  const index = active ?? length - 1;
  const step = Math.max(1, Math.floor(length / 6));
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? length - 1
        : event.key === "PageUp"
          ? index + step
          : event.key === "PageDown"
            ? index - step
            : ["ArrowRight", "ArrowUp"].includes(event.key)
              ? index + 1
              : ["ArrowLeft", "ArrowDown"].includes(event.key)
                ? index - 1
                : event.key === "Escape"
                  ? null
                  : undefined;
  if (next !== undefined) event.preventDefault();
  return next == null ? next : Math.max(0, Math.min(length - 1, next));
}
export function pathFor(
  data: readonly ChartDatum[],
  id: string,
  minimum: number,
  maximum: number,
  hidden = false,
) {
  if (!data.length) return "";
  const first = data[0].x ?? 0,
    last = data[data.length - 1].x ?? data.length - 1;
  const points = data.map((item, index) => ({
    x: (600 * ((item.x ?? index) - first)) / (last - first || 1),
    y: item.values[id],
  }));
  // Monotone cubic tangents (Fritsch-Carlson): the line is smooth through every point and never overshoots it.
  const ok = (value: number | undefined): value is number => value !== undefined && Number.isFinite(value);
  const slope = (k: number) => {
    const p = points[k], q = points[k + 1];
    return p && q && ok(p.y) && ok(q.y) ? (q.y - p.y) / (q.x - p.x || 1) : Number.NaN;
  };
  const tangents = points.map((_, k) => {
    const before = slope(k - 1), after = slope(k);
    if (!Number.isFinite(before)) return Number.isFinite(after) ? after : 0;
    if (!Number.isFinite(after)) return before;
    return before * after <= 0 ? 0 : (2 * before * after) / (before + after);
  });
  const samples = Array.from({ length: 97 }, (_, index) => {
    const x = (index / 96) * 600;
    let right = points.findIndex((point) => point.x >= x);
    if (right < 0) right = points.length - 1;
    const left = Math.max(0, right - 1);
    const a = points[left],
      b = points[right];
    const valid = ok(a.y) && ok(b.y);
    const h = b.x - a.x || 1;
    const t = Math.min(1, Math.max(0, (x - a.x) / h));
    const value = valid
      ? (2 * t ** 3 - 3 * t ** 2 + 1) * a.y! + (t ** 3 - 2 * t ** 2 + t) * h * tangents[left]! + (-2 * t ** 3 + 3 * t ** 2) * b.y! + (t ** 3 - t ** 2) * h * tangents[right]!
      : Number.NaN;
    return [
      x,
      hidden ? 210 : 210 - ((value - minimum) / (maximum - minimum || 1)) * 200,
    ] as [number, number];
  });
  return (
    line<[number, number]>()
      .defined((point) => Number.isFinite(point[1]))
      .x((point) => point[0])
      .y((point) => point[1])
      .curve(curveMonotoneX)(samples) ?? ""
  );
}
export function ChartReadout({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="chart-readout"
      aria-hidden="true"
      // A ruled line under the plot, not a box: the chart already sits on a surface.
      className="mt-4 min-h-11 border-t border-border pt-3 text-xs leading-5 tabular-nums"
    >
      {children}
    </div>
  );
}
