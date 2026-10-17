"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";

/** Press once, then repeat after a pause and speed up while the pointer is held. */
export function useHoldStep(step: () => void) {
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  const timers = useRef<number[]>([]);
  const fromPointer = useRef(false);

  function clear() {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }

  useEffect(() => {
    const onEnd = () => {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    };
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      onEnd();
    };
  }, []);

  function arm(wait: number, gap: number) {
    const id = window.setTimeout(() => {
      stepRef.current();
      arm(gap, Math.max(40, Math.round(gap * 0.8)));
    }, wait);
    timers.current.push(id);
  }

  return {
    onPointerDown(event: PointerEvent<HTMLButtonElement>) {
      if (event.button !== 0) return;
      fromPointer.current = true;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* The pointer can already be gone. */
      }
      clear();
      stepRef.current();
      arm(400, 150);
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
      if (event.key === " " || event.key === "Enter") clear();
    },
    onClick() {
      if (fromPointer.current) {
        fromPointer.current = false;
        return;
      }
      stepRef.current();
    },
  };
}
