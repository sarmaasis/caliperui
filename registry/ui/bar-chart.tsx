import type { ComponentProps } from "react";
import { cn } from "./lib/cn";
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
            index === values.length - 1
              ? "bg-brand"
              : "bg-brand/30 hover:bg-brand/50",
          )}
          style={{ height: `${Math.max(8, (value / peak) * 100)}%` }}
        />
      ))}
    </div>
  );
}
