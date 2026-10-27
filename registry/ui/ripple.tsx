"use client";
import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./ripple.css";

export type RippleProps = Omit<ComponentProps<"span">, "children"> & {
  /** Turns the ripple off, for a disabled host. */
  disabled?: boolean;
};

/**
 * Ink that spreads from where a surface is pressed. Place it last inside anything pressable that is positioned and
 * clips its overflow; it listens to its parent. A held press keeps the ink until release, Enter and Space start it
 * from the centre, and under reduced motion it is a brief tint instead.
 */
export function Ripple({ disabled = false, className, ...props }: RippleProps) {
  const layer = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ink = layer.current;
    const host = ink?.parentElement;
    if (!ink || !host || disabled) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    let held: { dot: HTMLElement; grown: Promise<unknown> } | null = null;

    const start = (x: number, y: number) => {
      const box = host.getBoundingClientRect();
      const radius = Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y));
      const dot = document.createElement("span");
      dot.dataset.slot = "ripple-ink";
      Object.assign(dot.style, { left: `${x - radius}px`, top: `${y - radius}px`, width: `${radius * 2}px`, height: `${radius * 2}px` });
      ink.append(dot);
      const grow = still.matches
        ? dot.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 90, fill: "forwards" })
        : dot.animate([{ transform: "scale(0)", opacity: 1 }, { transform: "scale(1)", opacity: 1 }], { duration: Math.min(560, 260 + radius), easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
      held = { dot, grown: grow.finished.catch(() => undefined) };
    };
    const end = () => {
      const current = held;
      held = null;
      if (!current) return;
      void current.grown.then(() => current.dot.animate([{ opacity: 1 }, { opacity: 0 }], { duration: still.matches ? 120 : 280, fill: "forwards" }).finished.then(() => current.dot.remove(), () => current.dot.remove()));
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const box = host.getBoundingClientRect();
      end();
      start(event.clientX - box.left, event.clientY - box.top);
    };
    const key = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ") || event.target !== host) return;
      end();
      start(host.clientWidth / 2, host.clientHeight / 2);
      if (event.key === "Enter") end();
    };
    const keyUp = (event: KeyboardEvent) => event.key === " " && end();

    host.addEventListener("pointerdown", down);
    host.addEventListener("keydown", key);
    host.addEventListener("keyup", keyUp);
    for (const type of ["pointerup", "pointerleave", "pointercancel", "blur"]) host.addEventListener(type, end);
    return () => {
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("keydown", key);
      host.removeEventListener("keyup", keyUp);
      for (const type of ["pointerup", "pointerleave", "pointercancel", "blur"]) host.removeEventListener(type, end);
      ink.replaceChildren();
    };
  }, [disabled]);

  return <span ref={layer} data-slot="ripple" aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", className)} {...props} />;
}
