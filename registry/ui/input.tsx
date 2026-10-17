import type { ComponentProps, ReactNode } from "react";
import { cn } from "./lib/cn";
import "./shared/input.css";
import "./shared/input-2.css";
import "./input.css";

const fieldText =
  "w-full min-w-0 text-base text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm";

export type InputProps = ComponentProps<"input"> & {
  /** Fixed text or an icon before the value, e.g. "caliper.app/". */
  leading?: ReactNode;
  /** Text, an icon or a status after the value, e.g. a spinner or a count. */
  trailing?: ReactNode;
};

/**
 * A recessed text field. Fields sit slightly below the paper (an inner shade
 * and a 3:1 ring); buttons stand on it, so what you fill and what you press
 * never look alike.
 */
export function Input({ className, leading, trailing, ...props }: InputProps) {
  if (leading === undefined && trailing === undefined) {
    return (
      <input
        data-slot="input"
        className={cn("flex h-[var(--control-height)] rounded-button px-3", fieldText, className)}
        {...props}
      />
    );
  }
  return (
    <span
      data-slot="input-group"
      data-disabled={props.disabled || undefined}
      data-invalid={props["aria-invalid"] === true || props["aria-invalid"] === "true" || undefined}
      data-readonly={props.readOnly || undefined}
      className={cn("flex h-[var(--control-height)] w-full min-w-0 items-center gap-2 rounded-button px-3", className)}
    >
      {leading !== undefined && <span data-slot="input-affix">{leading}</span>}
      <input data-slot="input-bare" className={cn("h-full flex-1 bg-transparent", fieldText)} {...props} />
      {trailing !== undefined && <span data-slot="input-trailing">{trailing}</span>}
    </span>
  );
}
