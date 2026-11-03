"use client";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "./lib/cn";
import { scrollParent } from "./lib/scroll-view";
import "./scroll-top-ring.css";

export type ScrollTopRingProps = Omit<ComponentProps<"button">, "children"> & {
  /** Pixels scrolled before the button appears. */
  threshold?: number;
  label?: string;
  /** The element that receives focus after the jump, by id; the top of the content when not given. */
  focusTarget?: string;
};

/**
 * A back-to-top button whose ring fills as you read. It springs in once you have scrolled past the threshold, stays
 * in the corner of whatever scrolls (the page or a panel), and returns you to the top with focus at the start of
 * the content. Place it last inside the scrolling content. Under reduced motion it appears without the spring and
 * the jump is instant.
 */
export function ScrollTopRing({ threshold = 400, label = "Back to top", focusTarget, className, onClick, ...props }: ScrollTopRingProps) {
  const button = useRef<HTMLButtonElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = button.current;
    if (!el) return;
    const scroller = scrollParent(el);
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = scroller ? scroller.scrollTop : scrollY;
      const room = scroller ? scroller.scrollHeight - scroller.clientHeight : document.documentElement.scrollHeight - innerHeight;
      setShown(top > threshold);
      ring.current?.style.setProperty("--str-p", String(room > 0 ? Math.min(1, top / room) : 0));
    };
    const schedule = () => (frame ||= requestAnimationFrame(update));
    const target = scroller ?? window;
    schedule();
    target.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener("scroll", schedule);
    };
  }, [threshold]);

  return (
    <button
      ref={button}
      type="button"
      aria-label={label}
      data-slot="scroll-top-ring"
      data-shown={shown ? "" : undefined}
      tabIndex={shown ? undefined : -1}
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event);
        const scroller = scrollParent(event.currentTarget);
        const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
        (scroller ?? window).scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
        const goal = (focusTarget && document.getElementById(focusTarget)) || (scroller ?? document.body).querySelector<HTMLElement>("h1, h2, h3, h4, h5, h6");
        if (goal) {
          if (!goal.hasAttribute("tabindex")) goal.setAttribute("tabindex", "-1");
          goal.focus({ preventScroll: true });
        }
      }}
      {...props}
    >
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle data-slot="str-track" cx={22} cy={22} r={20} />
        <circle ref={ring} data-slot="str-fill" cx={22} cy={22} r={20} pathLength={1} />
      </svg>
      <ArrowUp aria-hidden="true" />
    </button>
  );
}
