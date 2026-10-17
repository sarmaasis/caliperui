"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./tooltip.css";

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * The first tooltip waits 300ms; neighbours then show at once for 500ms.
 * Tooltips are labels, not panels, so their content is not hoverable: moving
 * along a toolbar switches straight to the next label.
 */
export function TooltipProvider({
  delayDuration = 300,
  skipDelayDuration = 500,
  disableHoverableContent = true,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      disableHoverableContent={disableHoverableContent}
      {...props}
    />
  );
}

export function TooltipContent({
  className,
  sideOffset = 6,
  shortcut,
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content> & {
  /** Keyboard shortcut shown after the label, e.g. "⌘D". */
  shortcut?: string;
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex max-w-60 items-center gap-2 rounded-control bg-foreground px-2.5 py-1.5 text-xs leading-4 font-medium text-background shadow-feedback",
          className,
        )}
        {...props}
      >
        {children}
        {shortcut && <kbd data-slot="tooltip-shortcut">{shortcut}</kbd>}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
