import type { ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./sparkline.css";

export type SparklineProps = Omit<ComponentProps<"svg">, "values"> & {
  values: readonly number[];
  label: string;
};

export function Sparkline({
  values,
  label,
  className,
  ...props
}: SparklineProps) {
  const width = 100;
  const height = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x =
      values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / span) * (height - 4) - 2;
    return [x, y] as const;
  });
  const line = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
  const fill = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      data-slot="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={cn("h-9 w-full text-foreground", className)}
      {...props}
    >
      <path d={fill} fill="currentColor" opacity="0.08" />
      <path
        key={values.join(",")}
        data-slot="sparkline-line"
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={100}
      />
    </svg>
  );
}
