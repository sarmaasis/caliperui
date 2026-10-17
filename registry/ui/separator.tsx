import type { ComponentProps, ReactNode } from "react";
import { cn } from "./lib/cn";
import "./separator.css";

export type SeparatorProps = Omit<ComponentProps<"div">, "children"> & {
  orientation?: "horizontal" | "vertical";
  /** Decoration only: hidden from assistive technology. Set false when the line divides regions people navigate between. */
  decorative?: boolean;
  /** A darker line, for dividing unrelated areas. */
  strong?: boolean;
  /** Indents a horizontal line from both edges, to sit between rows of a list. */
  inset?: boolean;
  /** Text in the line, such as "or continue with email". Horizontal only. */
  label?: ReactNode;
};

/**
 * A 1px divider in the same hairline the toolbar and dock draw. It is decoration by
 * default, so screen readers are not told about it; a labelled one is a real separator
 * with that text as its name.
 */
export function Separator({
  orientation = "horizontal",
  decorative = true,
  strong,
  inset,
  label,
  className,
  ...props
}: SeparatorProps) {
  if (label !== undefined && orientation === "horizontal") {
    return (
      <div
        data-slot="separator-labelled"
        role="separator"
        aria-orientation="horizontal"
        className={className}
        {...props}
      >
        {label}
      </div>
    );
  }
  return (
    <div
      data-slot="separator"
      data-orientation={orientation}
      data-strong={strong || undefined}
      data-inset={inset || undefined}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(className)}
      {...props}
    />
  );
}
