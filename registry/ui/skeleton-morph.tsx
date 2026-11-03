"use client";
import { useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./skeleton-morph.css";

export type SkeletonMorphProps = ComponentProps<"div"> & {
  /** While true, every element marked `data-bone` inside shows as a placeholder of its own size. */
  loading: boolean;
  /** Milliseconds between one block arriving and the next. */
  stagger?: number;
};

/**
 * Loading placeholders that turn into the real content block by block instead of swapping. Render the real layout
 * with stand-in text while loading and mark each block with `data-bone`; each bone has the block's own size, so
 * nothing moves when the data arrives, and the blocks fill in from first to last. `data-bone="round"` keeps a circle
 * (an avatar) round while it is a placeholder. The region is busy while loading.
 * Under reduced motion every block arrives at once.
 */
export function SkeletonMorph({ loading, stagger = 70, className, style, children, ...props }: SkeletonMorphProps) {
  const root = useRef<HTMLDivElement>(null);
  // Content that was never a placeholder shows as it is; only content that replaces bones plays the arrival.
  const [seen, setSeen] = useState({ loading, arrived: false });
  if (seen.loading !== loading) setSeen({ loading, arrived: seen.arrived || !loading });

  // Order follows the document, so the blocks arrive top to bottom however the children are composed.
  useLayoutEffect(() => {
    root.current?.querySelectorAll<HTMLElement>("[data-bone]").forEach((bone, index) => bone.style.setProperty("--sm-i", String(index)));
  });

  return (
    <div
      ref={root}
      data-slot="skeleton-morph"
      data-loading={loading ? "" : undefined}
      data-arrived={seen.arrived ? "" : undefined}
      aria-busy={loading || undefined}
      className={cn(className)}
      style={{ "--sm-stagger": `${stagger}ms`, ...style } as CSSProperties}
      {...props}
    >
      {loading && <span className="sr-only">Loading</span>}
      {/* The stand-in text is not read out or reachable while it is a placeholder. */}
      <div data-slot="sm-content" aria-hidden={loading || undefined} inert={loading} className="contents">
        {children}
      </div>
    </div>
  );
}
