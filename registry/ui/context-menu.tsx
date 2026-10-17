"use client";

import * as Primitive from "@radix-ui/react-context-menu";
import { useState, type ComponentProps } from "react";
import { GlideHighlight, useHighlightedGlide } from "./glide-highlight";
import { cn } from "./lib/cn";
import "./shared/dropdown-content.css";

export const ContextMenu = Primitive.Root;
export const ContextMenuTrigger = Primitive.Trigger;

const itemClass =
  "relative z-10 flex h-[var(--control-height)] cursor-default select-none items-center gap-2 rounded-surface px-3 text-sm font-medium outline-none data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0";

export function ContextMenuContent({
  className,
  collisionPadding = 16,
  children,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const box = useHighlightedGlide(content);
  return (
    <Primitive.Portal>
      <Primitive.Content
        ref={setContent}
        data-slot="dropdown-content"
        collisionPadding={collisionPadding}
        className={cn(
          "relative z-50 min-w-52 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-overlay border border-border bg-elevated p-1 text-sm text-foreground shadow-overlay outline-none",
          className,
        )}
        {...props}
      >
        <GlideHighlight box={box} />
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export function ContextMenuItem({
  className,
  ...props
}: ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      data-slot="dropdown-item"
      className={cn(itemClass, className)}
      {...props}
    />
  );
}
