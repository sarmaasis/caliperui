"use client";
import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./boop.css";

export type BoopProps = ComponentProps<"span"> & {
  /** Degrees to turn. */
  rotate?: number;
  /** Size at the peak, 1 for none. */
  scale?: number;
  /** Pixels to shift sideways and down. */
  x?: number;
  y?: number;
  /** How long the push lasts before the spring brings it back, in ms. */
  timing?: number;
};

/**
 * Gives an icon a small springy nudge when the control around it is hovered or focused, then lets it settle back on
 * its own even if the pointer stays. Wrap the icon inside the button or link; the parent is what triggers it. Under
 * reduced motion nothing moves.
 */
export function Boop({ rotate = 0, scale = 1, x = 0, y = 0, timing = 160, className, style, children, ...props }: BoopProps) {
  const root = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const host = root.current?.parentElement;
    if (!host) return;
    const trigger = () => setOn(true);
    host.addEventListener("pointerenter", trigger);
    host.addEventListener("focusin", trigger);
    return () => {
      host.removeEventListener("pointerenter", trigger);
      host.removeEventListener("focusin", trigger);
    };
  }, []);

  useEffect(() => {
    if (!on) return;
    const timer = window.setTimeout(() => setOn(false), timing);
    return () => window.clearTimeout(timer);
  }, [on, timing]);

  return (
    <span
      ref={root}
      data-slot="boop"
      data-on={on ? "" : undefined}
      className={cn("inline-flex", className)}
      style={{ "--boop-r": `${rotate}deg`, "--boop-s": scale, "--boop-x": `${x}px`, "--boop-y": `${y}px`, ...style } as CSSProperties}
      {...props}
    >
      {children}
    </span>
  );
}
