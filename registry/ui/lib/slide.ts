"use client";

import { useEffect, useRef } from "react";

/**
 * Slides content in when `key` changes (a new week, month or view): from the side you moved toward, or a plain fade
 * when the move has no direction. The element is animated in place, never remounted, so scroll and focus survive.
 * Call `toward(-1 | 1)` just before the change. Reduced motion swaps at once.
 */
export function useSlideOnChange<T extends HTMLElement = HTMLDivElement>(key: string) {
  const ref = useRef<T>(null);
  const direction = useRef(0);
  const shown = useRef(key);
  useEffect(() => {
    if (shown.current === key) return;
    shown.current = key;
    const from = direction.current;
    direction.current = 0;
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current.animate([{ opacity: 0.35, transform: `translateX(${from * 14}px)` }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  }, [key]);
  return { ref, toward: (step: number) => { direction.current = Math.sign(step); } };
}
