import type { ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./loader.css";

export type LoaderVariant = "spinner" | "dots" | "bars" | "morph";

const marks = {
  dots: 3,
  bars: 3,
} as const;

export function Loader({
  variant = "spinner",
  size = 20,
  label = "Loading",
  className,
  ...props
}: Omit<ComponentProps<"span">, "children"> & {
  variant?: LoaderVariant;
  size?: number;
  label?: string;
}) {
  const count = variant === "dots" || variant === "bars" ? marks[variant] : 0;
  return (
    <span
      role="status"
      aria-label={label}
      data-slot="loader"
      data-variant={variant}
      className={cn("inline-flex items-center justify-center text-foreground", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      {variant === "spinner" && <span data-slot="loader-spinner" />}
      {variant === "morph" && <span data-slot="loader-morph" />}
      {count > 0 &&
        Array.from({ length: count }, (_, index) => (
          <span
            key={index}
            data-slot={variant === "dots" ? "loader-dot" : "loader-bar"}
            style={{ animationDelay: `calc(${index} * var(--delay-stagger))` }}
          />
        ))}
    </span>
  );
}
