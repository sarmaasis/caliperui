"use client";
import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./gesture-hint.css";

export type GestureKind = "tap" | "swipe-left" | "swipe-right" | "swipe-up" | "drag";

export type GestureHintProps = Omit<ComponentProps<"div">, "children"> & {
  /** The gesture to demonstrate. */
  gesture?: GestureKind;
  /** Says what the gesture does, shown beneath the hand: "Swipe to archive". */
  label: string;
  /** Times the demonstration plays before it rests. */
  plays?: number;
  /** Wait before the first play, in milliseconds. */
  delay?: number;
  /** Called once when the hint leaves because the person acted on the area. */
  onDismiss?: () => void;
};

/**
 * A ghost finger that shows a gesture once, on first sight of a swipeable or tappable thing, instead of a block
 * of instructions. It sits over its parent (which must be positioned), plays the movement a few times with a
 * caption, and leaves for good the moment the person touches the area. It never takes pointer input itself. The
 * caption is real text, read as a note. Under reduced motion the finger rests at the start of the movement with
 * the caption beneath.
 */
export function GestureHint({ gesture = "tap", label, plays = 3, delay = 600, onDismiss, className, style, ...props }: GestureHintProps) {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const dismissed = useRef(onDismiss);

  useEffect(() => {
    dismissed.current = onDismiss;
  });

  useEffect(() => {
    const parent = root.current?.parentElement;
    if (!parent || gone) return;
    const leave = () => {
      setGone(true);
      dismissed.current?.();
    };
    parent.addEventListener("pointerdown", leave, { once: true });
    parent.addEventListener("keydown", leave, { once: true });
    return () => {
      parent.removeEventListener("pointerdown", leave);
      parent.removeEventListener("keydown", leave);
    };
  }, [gone]);

  if (gone) return null;
  return (
    <div
      ref={root}
      role="note"
      data-slot="gesture-hint"
      data-gesture={gesture}
      className={cn("pointer-events-none absolute inset-0 grid place-content-center justify-items-center gap-3", className)}
      style={{ "--gh-plays": plays, "--gh-delay": `${delay}ms`, ...style } as CSSProperties}
      {...props}
    >
      <span data-slot="gh-stage" aria-hidden="true">
        <i data-slot="gh-ring" />
        <i data-slot="gh-finger" />
      </span>
      <span data-slot="gh-label">{label}</span>
    </div>
  );
}
