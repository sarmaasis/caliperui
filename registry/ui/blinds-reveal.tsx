"use client";
import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./blinds-reveal.css";

export type BlindsRevealProps = ComponentProps<"div"> & {
  /** Controlled state. Leave unset to open once the block scrolls into view. */
  revealed?: boolean;
  /** Number of slats, 2 to 16. Two is a pair of curtains. */
  slats?: number;
  /** Which way the slats run. */
  direction?: "vertical" | "horizontal";
  /** The colour the slats are drawn in; any CSS colour. */
  color?: string;
};

/**
 * Content hidden behind a row of slats that fold away one after another, left to right or top to bottom, as the
 * block scrolls into view or when told to. The content underneath settles from a touch larger as it is uncovered.
 * It is always in the document and readable by assistive technology, so only sighted users see the cover; the
 * slats never take pointer input. Under reduced motion the content simply appears.
 */
export function BlindsReveal({ revealed, slats = 8, direction = "vertical", color, className, style, children, ...props }: BlindsRevealProps) {
  const root = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const open = revealed ?? seen;
  const count = Math.max(2, Math.min(16, Math.round(slats)));

  useEffect(() => {
    const node = root.current;
    if (revealed !== undefined || !node) return;
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSeen(true);
        watch.disconnect();
      },
      { threshold: 0.25 },
    );
    watch.observe(node);
    return () => watch.disconnect();
  }, [revealed]);

  return (
    <div
      ref={root}
      data-slot="blinds-reveal"
      data-open={open ? "" : undefined}
      data-direction={direction}
      className={cn("relative", className)}
      style={{ "--bl-n": count, ...(color ? { "--bl-color": color } : null), ...style } as CSSProperties}
      {...props}
    >
      <div data-slot="bl-content">{children}</div>
      <span data-slot="bl-slats" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <i key={index} style={{ "--bl-i": index } as CSSProperties} />
        ))}
      </span>
    </div>
  );
}
