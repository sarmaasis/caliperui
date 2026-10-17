import type { ComponentProps, ReactNode } from "react";
import { cn } from "./lib/cn";

export type StatCardProps = Omit<ComponentProps<"div">, "children"> & {
  label: string;
  value: string | number;
  description?: string;
  change?: ReactNode;
};

export function StatCard({
  label,
  value,
  description,
  change,
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      data-slot="stat-card"
      className={cn("min-w-0 py-4 [overflow-wrap:anywhere]", className)}
      {...props}
    >
      <dl>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-2 font-mono text-2xl leading-8 font-medium tabular-nums">
          {value}
        </dd>
      </dl>
      {description && (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      )}
      {change != null && <div className="mt-2 text-xs leading-5">{change}</div>}
    </div>
  );
}
