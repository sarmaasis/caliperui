import type { ComponentProps, CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./shared/bar-chart.css";
import "./bar-chart.css";

export type BarChartProps = Omit<ComponentProps<"div">, "children"> & {
  values: readonly number[];
  label: string;
  /** One short label per bar, drawn under the baseline. */
  labels?: readonly string[];
};

export function BarChart({
  values,
  label,
  labels,
  className,
  ...props
}: BarChartProps) {
  const peak = Math.max(...values, 1);
  return (
    <div data-slot="bar-chart" role="img" aria-label={label} className={cn("grid gap-2", className)} {...props}>
      <div className="flex h-28 items-end gap-[clamp(2px,2%,10px)] border-b border-border">
        {values.map((value, index) => (
          <div
            key={index}
            data-slot="bar"
            className={cn(
              "min-h-1 flex-1 rounded-t-[min(6px,30%)]",
              // Data colour, not ink: the latest bar in full, the rest as a quiet run of the same series.
              index === values.length - 1
                ? "bg-[var(--chart-1)]"
                : "bg-[color-mix(in_srgb,var(--chart-1)_32%,transparent)] hover:bg-[color-mix(in_srgb,var(--chart-1)_55%,transparent)]",
            )}
            style={{ height: `${Math.max(8, (value / peak) * 100)}%`, "--i": index } as CSSProperties}
          />
        ))}
      </div>
      {labels && (
        <div aria-hidden="true" className="flex gap-[clamp(2px,2%,10px)] text-[11px] text-muted-foreground">
          {values.map((_, index) => (
            <span key={index} className={cn("min-w-0 flex-1 truncate text-center", index === values.length - 1 && "text-foreground")}>
              {labels[index]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
