import type { ComponentProps, ReactNode } from "react";
import { cn } from "./lib/cn";
import { Sparkline } from "./sparkline";

export type MetricProps = Omit<ComponentProps<"article">, "children"> & {
  label: string;
  value: ReactNode;
  context?: string;
  change?: string;
  series?: readonly number[];
};

export function Metric({
  label,
  value,
  context,
  change,
  series,
  className,
  ...props
}: MetricProps) {
  const tone = change?.startsWith("+")
    ? "text-success"
    : change?.startsWith("-")
      ? "text-warning"
      : "text-muted-foreground";
  return (
    <article
      data-slot="metric"
      className={cn(
        "flex min-w-0 flex-col rounded-overlay border border-border bg-background p-4",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xs leading-[18px] font-medium text-muted-foreground">
          {label}
        </h3>
        {change && (
          <p className={cn("text-xs tabular-nums", tone)}>{change}</p>
        )}
      </div>
      <p className="mt-3 text-2xl leading-8 font-medium tabular-nums">
        {value}
      </p>
      {context && (
        <p className="mt-1 text-xs text-muted-foreground">{context}</p>
      )}
      {series && series.length > 1 && (
        <Sparkline className="mt-3" values={series} label={`${label} trend`} />
      )}
    </article>
  );
}
