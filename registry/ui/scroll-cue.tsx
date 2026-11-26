"use client";
import { useEffect, useState, type ComponentProps } from "react";
import { cn } from "./lib/cn";
import { scrollParent } from "./lib/scroll-view";
import "./scroll-cue.css";

export type ScrollCueProps = Omit<ComponentProps<"button">, "children" | "onClick"> & {
  /** The glyph: a mouse with a wheel dot, or three chevrons that pour downward. */
  variant?: "mouse" | "chevrons";
  /** The visible word beside the glyph, and the button's name. */
  label?: string;
  /** A selector to scroll to when pressed. Without one the page moves down by most of a screen. */
  target?: string;
  /** How far the page must scroll, in pixels, before the cue leaves. */
  leaveAfter?: number;
};

/**
 * The small "keep going" cue under a hero or at the foot of a first screen. A wheel dot slides down a mouse
 * outline (or chevrons pour downward) on a loop; once the person scrolls, the cue fades away and leaves the tab
 * order. It is a button, so keyboard users can press it: it scrolls to the target, or down by most of a screen.
 * Under reduced motion the glyph is still.
 */
export function ScrollCue({ variant = "mouse", label = "Scroll", target, leaveAfter = 48, className, ...props }: ScrollCueProps) {
  const [gone, setGone] = useState(false);
  const [node, setNode] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!node) return;
    // Scroll events do not bubble, so listen in the capture phase and keep only the scroller this cue sits in (or the page).
    const update = (event?: Event) => {
      const target = event?.target;
      if (target instanceof HTMLElement && !target.contains(node)) return;
      const top = target instanceof HTMLElement ? target.scrollTop : window.scrollY;
      setGone(top > leaveAfter);
    };
    const first = requestAnimationFrame(() => update());
    document.addEventListener("scroll", update, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(first);
      document.removeEventListener("scroll", update, { capture: true });
    };
  }, [node, leaveAfter]);

  const go = () => {
    const behavior: ScrollBehavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const found = target ? document.querySelector(target) : null;
    if (found) found.scrollIntoView({ behavior, block: "start" });
    else ((node && scrollParent(node)) || window).scrollBy({ top: innerHeight * 0.8, behavior });
  };

  return (
    <button
      ref={setNode}
      type="button"
      data-slot="scroll-cue"
      data-variant={variant}
      data-gone={gone ? "" : undefined}
      aria-label={label}
      tabIndex={gone ? -1 : undefined}
      aria-hidden={gone ? true : undefined}
      onClick={go}
      className={cn("inline-flex", className)}
      {...props}
    >
      {variant === "mouse" ? (
        <span data-slot="scu-mouse" aria-hidden="true">
          <i />
        </span>
      ) : (
        <span data-slot="scu-chevrons" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
      <span data-slot="scu-label">{label}</span>
    </button>
  );
}
