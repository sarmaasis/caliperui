import type { ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./shared/select.css";
import "./shared/input-2.css";

export function Select({
  className,
  multiple,
  size,
  ...props
}: ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "block h-[var(--control-height)] w-full min-w-0 rounded-button pl-3 text-base text-foreground outline-none disabled:cursor-not-allowed md:text-sm",
        (multiple || (size !== undefined && size > 1)) &&
          "h-auto min-h-[var(--control-height)] py-2 pr-3",
        className,
      )}
      multiple={multiple}
      size={size}
      {...props}
    />
  );
}
