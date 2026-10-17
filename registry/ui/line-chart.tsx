"use client";
import { area, curveMonotoneX } from "d3-shape";
import { useState, type CSSProperties } from "react";
import { cn } from "./lib/cn";
import {
  ChartTable,
  ChartMessage,
  ChartLegend,
  ChartReadout,
  chartColor,
  numberText,
  pathFor,
  pointKey,
  useChartReveal,
  type ChartDatum,
  type ChartSeries,
} from "./chart-parts";
import "./shared/chart-crosshair.css";
import "./line-chart.css";
export type LineChartProps = {
  label: string;
  data: readonly ChartDatum[];
  series: readonly ChartSeries[];
  unit?: string;
  loading?: boolean;
  error?: string;
  className?: string;
  band?: { lower: string; upper: string };
};
export function LineChart({
  label,
  data,
  series,
  unit = "",
  loading,
  error,
  className,
  band,
}: LineChartProps) {
  const root = useChartReveal();
  const [hidden, setHidden] = useState<string[]>([]),
    [reading, setReading] = useState<number | null>(null);
  const visible = series.filter((item) => !hidden.includes(item.id));
  const values = data.flatMap((item) =>
    visible
      .map((s) => item.values[s.id])
      .filter(
        (value): value is number =>
          value !== undefined && Number.isFinite(value),
      ),
  );
  const extremes = band
    ? data.flatMap((item) => [
        item.values[band.lower] ?? 0,
        item.values[band.upper] ?? 0,
      ])
    : values;
  const min = Math.min(0, ...extremes),
    max = Math.max(1, ...extremes);
  const index = reading === null ? null : Math.min(reading, data.length - 1);
  const datum = index === null ? null : data[index];
  function scrub(clientX: number, rect: DOMRect) {
    if (!data.length) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const first = data[0].x ?? 0,
      last = data.at(-1)?.x ?? data.length - 1;
    let nearest = 0;
    data.forEach((item, i) => {
      if (
        Math.abs((item.x ?? i) - (first + ratio * (last - first))) <
        Math.abs(
          (data[nearest].x ?? nearest) - (first + ratio * (last - first)),
        )
      )
        nearest = i;
    });
    setReading(nearest);
  }
  const text = datum
    ? `${datum.label}. ${visible.map((item) => `${item.label}: ${datum.values[item.id] === undefined ? "No reading" : numberText(datum.values[item.id]!)} ${unit}`).join(". ")}${datum.event ? `. ${datum.event}` : ""}`
    : label;
  return (
    <figure
      ref={root}
      aria-label={label}
      data-slot="line-chart"
      aria-busy={loading}
      className={cn("min-w-0", className)}
    >
      <figcaption className="mb-3 text-sm font-medium">{label}</figcaption>
      <ChartLegend
        series={series}
        hidden={hidden}
        onToggle={(id) =>
          setHidden(
            hidden.includes(id)
              ? hidden.filter((key) => key !== id)
              : [...hidden, id],
          )
        }
      />
      <ChartMessage loading={loading} error={error} empty={!data.length} />
      {!error && !!data.length && (
        <>
          <div className="relative mt-4 pl-9" data-slot="chart-frame">
            <div
              className="absolute inset-y-0 left-0 flex flex-col justify-between pb-7 text-[11px] tabular-nums text-muted-foreground"
              aria-hidden="true"
            >
              <span>{numberText(max)}</span>
              <span>{numberText((max + min) / 2)}</span>
              <span>{numberText(min)}</span>
            </div>
            <div
              role="slider"
              tabIndex={0}
              aria-label={`${label}, explore points`}
              aria-valuemin={0}
              aria-valuemax={data.length - 1}
              aria-valuenow={index ?? data.length - 1}
              aria-valuetext={text}
              data-slot="chart-plot"
              className="relative touch-pan-y outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onFocus={() => setReading(data.length - 1)}
              onBlur={() => setReading(null)}
              onKeyDown={(event) => {
                const next = pointKey(event, index, data.length);
                if (next !== undefined) setReading(next);
              }}
              onPointerMove={(event) => {
                if (
                  event.pointerType === "mouse" ||
                  event.currentTarget.hasPointerCapture(event.pointerId)
                )
                  scrub(
                    event.clientX,
                    event.currentTarget.getBoundingClientRect(),
                  );
              }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                scrub(
                  event.clientX,
                  event.currentTarget.getBoundingClientRect(),
                );
              }}
              onPointerLeave={(event) => {
                if (
                  !event.currentTarget.hasPointerCapture(event.pointerId) &&
                  document.activeElement !== event.currentTarget
                )
                  setReading(null);
              }}
              onPointerUp={(event) => {
                event.currentTarget.releasePointerCapture(event.pointerId);
                if (event.pointerType !== "mouse") setReading(null);
              }}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 600 220"
                className="block h-52 w-full overflow-visible"
                preserveAspectRatio="none"
              >
                {[10, 110, 210].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    x2="600"
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray="2 4"
                  />
                ))}
                {band && (
                  <path
                    fill="var(--chart-1)"
                    opacity=".12"
                    d={
                      area<ChartDatum>()
                        .x(
                          (item, i) =>
                            (600 * ((item.x ?? i) - (data[0].x ?? 0))) /
                            ((data.at(-1)?.x ?? data.length - 1) -
                              (data[0].x ?? 0) || 1),
                        )
                        .y0(
                          (item) =>
                            210 -
                            (((item.values[band.lower] ?? 0) - min) /
                              (max - min)) *
                              200,
                        )
                        .y1(
                          (item) =>
                            210 -
                            (((item.values[band.upper] ?? 0) - min) /
                              (max - min)) *
                              200,
                        )
                        .curve(curveMonotoneX)([...data]) ?? ""
                    }
                  />
                )}
                {series.map((item, i) => {
                  const d = pathFor(
                    data,
                    item.id,
                    min,
                    max,
                    hidden.includes(item.id),
                  );
                  return (
                    <path
                      key={item.id}
                      data-slot="chart-line"
                      d={d}
                      style={
                        {
                          d: `path("${d}")`,
                          opacity: hidden.includes(item.id) ? 0.12 : 1,
                        } as CSSProperties
                      }
                      fill="none"
                      stroke={item.color ?? chartColor(i)}
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                      pathLength="1"
                    />
                  );
                })}
                {datum && (
                  <g
                    data-slot="chart-crosshair"
                    style={{
                      transform: `translateX(${(600 * ((datum.x ?? index!) - (data[0].x ?? 0))) / ((data.at(-1)?.x ?? data.length - 1) - (data[0].x ?? 0) || 1)}px)`,
                    }}
                  >
                    <line
                      y1="0"
                      y2="220"
                      stroke="var(--muted-foreground)"
                      strokeDasharray="3 3"
                    />
                    {visible.map(
                      (item, i) =>
                        datum.values[item.id] !== undefined && (
                          <circle
                            key={item.id}
                            cy={
                              210 -
                              ((datum.values[item.id]! - min) / (max - min)) *
                                200
                            }
                            r="4"
                            fill={item.color ?? chartColor(i)}
                            stroke="var(--elevated)"
                            strokeWidth="2"
                          />
                        ),
                    )}
                  </g>
                )}
                {data.map(
                  (item, i) =>
                    item.event && (
                      <circle
                        key={item.id}
                        cx={(600 * i) / (data.length - 1 || 1)}
                        cy="220"
                        r="3"
                        fill="var(--chart-2)"
                      />
                    ),
                )}
              </svg>
            </div>
            <div
              aria-hidden="true"
              className="mt-2 flex justify-between gap-3 text-[11px] text-muted-foreground"
            >
              <span>{data[0].label}</span>
              <span>{data.at(-1)?.label}</span>
            </div>
          </div>
          <ChartReadout>
            {datum ? (
              <>
                <span className="font-medium">{datum.label}</span>
                <div className="flex flex-wrap gap-x-4">
                  {visible.map((item) => (
                    <span key={item.id}>
                      {item.label}{" "}
                      <strong className="font-medium tabular-nums">
                        {datum.values[item.id] === undefined
                          ? "—"
                          : numberText(datum.values[item.id]!)}{" "}
                        {unit}
                      </strong>
                    </span>
                  ))}
                  {datum.event && <span>{datum.event}</span>}
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">
                Hover, drag, or use arrow keys to read a point.
                {!visible.length ? " All series hidden." : ""}
              </span>
            )}
          </ChartReadout>
        </>
      )}
      <ChartTable
        label={label}
        headers={["Point", ...series.map((item) => item.label), "Event"]}
        rows={data.map((item) => [
          item.label,
          ...series.map((s) => item.values[s.id] ?? "—"),
          item.event ?? "",
        ])}
      />
    </figure>
  );
}
