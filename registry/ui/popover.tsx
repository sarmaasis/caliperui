"use client";

import * as Primitive from "@radix-ui/react-popover";
import type { ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./shared/popover-content.css";
import "./popover.css";

export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;
export const PopoverClose = Primitive.Close;
export const PopoverAnchor = Primitive.Anchor;

export function PopoverContent({
  className,
  sideOffset = 8,
  collisionPadding = 16,
  arrow = false,
  children,
  ...props
}: ComponentProps<typeof Primitive.Content> & {
  /** Points at the trigger and follows collision shifts. */
  arrow?: boolean;
}) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        data-slot="popover-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "z-50 w-80 max-w-[calc(100vw-2rem)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-surface border border-border bg-elevated p-3.5 text-sm text-foreground shadow-overlay outline-none",
          arrow && "overflow-visible",
          className,
        )}
        {...props}
      >
        {children}
        {arrow && <Primitive.Arrow data-slot="popover-arrow" width={14} height={7} />}
      </Primitive.Content>
    </Primitive.Portal>
  );
}
