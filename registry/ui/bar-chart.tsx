import type { ComponentProps, CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./shared/bar-chart.css";
import "./bar-chart.css";

export type BarChartProps = Omit<ComponentProps<"div">, "children"> & {
  values: readonly number[];
  label: string;
};

export function BarChart({
  values,
  label,
  className,
  ...props
}: BarChartProps) {
  const peak = Math.max(...values, 1);
  return (
    <div
      data-slot="bar-chart"
      role="img"
      aria-label={label}
      className={cn("flex h-28 items-end gap-1", className)}
      {...props}
    >
      {values.map((value, index) => (
        <div
          key={index}
          data-slot="bar"
          className={cn(
            "min-h-1 flex-1 rounded-t-control",
            // Data colour, not ink: the latest bar in full, the rest as a quiet run of the same series.
            index === values.length - 1
              ? "bg-[var(--chart-1)]"
              : "bg-[color-mix(in_srgb,var(--chart-1)_32%,transparent)] hover:bg-[color-mix(in_srgb,var(--chart-1)_55%,transparent)]",
          )}
          style={{ height: `${Math.max(8, (value / peak) * 100)}%`, "--i": index } as CSSProperties}
        />
      ))}
    </div>
  );
}
