"use client";

import { useImperativeHandle, useLayoutEffect, useRef, type ComponentProps } from "react";
import "./slider.css";

export type SliderProps = Omit<ComponentProps<"input">, "type">;

/**
 * A native range input with an ink fill that tracks the value and a raised
 * thumb that grows slightly while dragged. Pair it with a number field when
 * people need exact entry.
 */
export function Slider({ ref, onInput, ...props }: SliderProps) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current!, []);

  function sync() {
    const element = input.current;
    if (!element) return;
    const min = Number(element.min || 0);
    const max = Number(element.max || 100);
    const ratio = max > min ? (Number(element.value) - min) / (max - min) : 0;
    element.style.setProperty("--fill", `${Math.min(1, Math.max(0, ratio)) * 100}%`);
  }

  // Controlled values change without an input event; resync every render.
  useLayoutEffect(sync);

  return (
    <input
      data-slot="slider"
      {...props}
      ref={input}
      type="range"
      onInput={(event) => {
        sync();
        onInput?.(event);
      }}
    />
  );
}
