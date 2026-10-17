"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "./lib/cn";
import "./skeleton.css";

const widths = ["100%", "94%", "78%", "88%", "66%", "84%"];

export function Skeleton({
  label = "Loading content",
  lines = 3,
  avatar = false,
  loading = true,
  children,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  label?: string;
  lines?: number;
  avatar?: boolean;
  loading?: boolean;
  children?: ReactNode;
}) {
  const count = Math.min(6, Math.max(1, Math.round(lines)));
  const placeholder = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  const hasContent = children != null;

  useLayoutEffect(() => {
    const node = (loading ? placeholder : content).current;
    if (!hasContent || !node) return;
    setHeight(node.getBoundingClientRect().height);
  }, [avatar, count, hasContent, loading, children]);

  const blocks = (
    <div ref={placeholder} data-slot="skeleton-placeholder" className="flex gap-3">
      {avatar && (
        <span
          data-slot="skeleton-block"
          className="size-8 shrink-0 rounded-surface"
          style={{ animationDelay: "0ms" }}
        />
      )}
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        {Array.from({ length: count }, (_, index) => (
          <span
            key={index}
            data-slot="skeleton-block"
            className="block h-2.5 max-w-full"
            style={{
              width: widths[(index + (avatar ? 1 : 0)) % widths.length],
              animationDelay: `calc(${index + (avatar ? 1 : 0)} * var(--delay-stagger))`,
            }}
          />
        ))}
      </span>
    </div>
  );

  if (!hasContent) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={label}
        data-slot="skeleton"
        data-loading="true"
        className={className}
        {...props}
      >
        {blocks}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-busy={loading || undefined}
      aria-label={loading ? label : undefined}
      data-slot="skeleton"
      data-loading={loading}
      data-has-content="true"
      className={cn("relative overflow-hidden", className)}
      style={height != null ? { height } : undefined}
      {...props}
    >
      {blocks}
      <div ref={content} data-slot="skeleton-content">
        {children}
      </div>
    </div>
  );
}
