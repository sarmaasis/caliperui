"use client";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./clip-reveal.css";

export type ClipRevealProps = ComponentProps<"div"> & {
  /** The edge the wipe starts from, or an iris that opens from the middle. */
  from?: "bottom" | "top" | "left" | "right" | "iris";
  /** Hides again when scrolled out of view, so the wipe plays each time. */
  repeat?: boolean;
  /** Extra wait before the wipe, in ms, for staggering neighbours. */
  delay?: number;
};

/**
 * Uncovers an image or section with a wipe as it scrolls into view, the content settling from a slight zoom behind
 * the edge. It never changes layout. Anything already on screen when the page loads is left as it is, so nothing
 * flashes away and back, and under reduced motion everything simply shows.
 */
export function ClipReveal({ from = "bottom", repeat = false, delay = 0, className, style, children, ...props }: ClipRevealProps) {
  const root = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const element = root.current;
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let armed = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (!armed) {
          armed = true;
          // Only arm what starts out of view; content already visible stays put.
          if (entry.isIntersecting) {
            if (!repeat) observer.disconnect();
            return;
          }
          setState("hidden");
          return;
        }
        if (entry.isIntersecting) {
          setState("shown");
          if (!repeat) observer.disconnect();
        } else if (repeat) setState("hidden");
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [repeat]);

  return (
    <div
      ref={root}
      data-slot="clip-reveal"
      data-from={from}
      data-state={state}
      className={cn("relative overflow-hidden", className)}
      style={style}
      {...props}
    >
      <div data-slot="cr-inner" style={{ transitionDelay: `${delay}ms` }}>
        {children}
      </div>
    </div>
  );
}
