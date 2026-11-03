"use client";
import { useRef, useState, type ComponentProps, type CSSProperties } from "react";
import { Badge, type BadgeTone } from "./badge";
import { cn } from "./lib/cn";
import "./tag-overflow.css";

export type OverflowTag = { label: string; tone?: BadgeTone };

export type TagOverflowProps = Omit<ComponentProps<"div">, "children"> & {
  /** Names the set, e.g. "Labels". */
  label: string;
  tags: (string | OverflowTag)[];
  /** Tags shown before the rest fold into a count. */
  max?: number;
};

/**
 * A row of tags that shows the first few and folds the rest into a "+N" count. Choosing the count opens the rest
 * one after another in place, and "Show less" folds them back, with focus kept on the toggle. For table cells,
 * cards and headers where tags must not take over. Under reduced motion the tags appear without the stagger.
 */
export function TagOverflow({ label, tags, max = 3, className, ...props }: TagOverflowProps) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(0); // counts openings, so the new tags replay their entrance each time
  const toggle = useRef<HTMLButtonElement>(null);
  const items = tags.map((tag) => (typeof tag === "string" ? { label: tag } : tag));
  const hidden = Math.max(0, items.length - max);
  const shown = open ? items : items.slice(0, max);

  return (
    <div role="group" aria-label={label} data-slot="tag-overflow" className={cn("flex flex-wrap items-center gap-1.5", className)} {...props}>
      {shown.map((tag, i) => (
        <Badge key={i >= max ? `${opened}-${i}` : i} tone={tag.tone} data-extra={i >= max ? "" : undefined} style={{ "--to-i": i - max } as CSSProperties}>
          {tag.label}
        </Badge>
      ))}
      {hidden > 0 && (
        <button
          ref={toggle}
          type="button"
          data-slot="to-toggle"
          aria-expanded={open}
          aria-label={open ? "Show fewer tags" : `Show ${hidden} more ${hidden === 1 ? "tag" : "tags"}`}
          onClick={() => {
            if (!open) setOpened((count) => count + 1);
            setOpen(!open);
          }}
        >
          {open ? "Show less" : `+${hidden}`}
        </button>
      )}
    </div>
  );
}
