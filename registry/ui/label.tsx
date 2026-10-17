import type { ComponentProps } from "react";
import { cn } from "./lib/cn";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "inline-block max-w-full text-sm leading-5 font-medium [overflow-wrap:anywhere]",
        className,
      )}
      {...props}
    />
  );
}
