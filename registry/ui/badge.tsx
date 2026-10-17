import type { ComponentProps } from "react";
import { cn } from "./lib/cn";

const variants = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-brand-subtle text-[color-mix(in_srgb,var(--accent-text)_82%,var(--foreground))]",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  error: "bg-destructive-subtle text-destructive",
};

/* Status survives without colour: each variant has its own shape. */
const shapes = {
  neutral: <path d="M2 5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  info: <circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />,
  success: <circle cx="5" cy="5" r="4" fill="currentColor" />,
  warning: (
    <>
      <path d="M5 1a4 4 0 0 1 0 8z" fill="currentColor" />
      <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </>
  ),
  error: <path d="M2 2l6 6M8 2 2 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
};

export type BadgeProps = ComponentProps<"span"> & {
  variant?: keyof typeof variants;
  /** The status shape before the word. On for status variants, off for neutral labels and counts. */
  shape?: boolean;
};

export function Badge({
  className,
  variant = "neutral",
  shape = variant !== "neutral",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-xs leading-4 font-medium [&_svg]:size-3",
        shape && "pl-[7px]",
        variants[variant],
        className,
      )}
      {...props}
    >
      {shape && (
        <svg data-slot="badge-shape" viewBox="0 0 10 10" aria-hidden="true" className="!size-2.5">
          {shapes[variant]}
        </svg>
      )}
      {children}
    </span>
  );
}
