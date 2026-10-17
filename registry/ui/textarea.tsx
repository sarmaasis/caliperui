import type { ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./shared/input-2.css";
import "./textarea.css";

/** A recessed multi-line field that grows with the draft from 3 to 8 lines, then scrolls. */
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "block min-h-[88px] max-h-[200px] w-full min-w-0 resize-none rounded-button px-3 py-[9px] text-base leading-[22px] text-foreground outline-none [field-sizing:content] placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm md:leading-[22px]",
        className,
      )}
      {...props}
    />
  );
}
