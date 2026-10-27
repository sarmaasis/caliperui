"use client";
import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";
import { cn } from "./lib/cn";
import "./sparkle-text.css";

export type SparkleTextProps = Omit<ComponentProps<"span">, "color"> & {
  /** Colour of the sparkles, or a few colours for each star to pick from; defaults to the accent. */
  color?: string | string[];
  /** Turns the sparkles off without changing the text. */
  disabled?: boolean;
};

type Sparkle = { id: number; x: number; y: number; size: number; born: number; tint: number };

const LIFE = 760;
const random = (min: number, max: number) => min + Math.random() * (max - min);
const make = (now: number): Sparkle => ({ id: now + Math.random(), x: random(-4, 100), y: random(-10, 92), size: random(9, 17), born: now, tint: Math.floor(random(0, 64)) });

/**
 * Text with small four-point stars that bloom and fade around it at uneven moments, for the one word that should
 * feel special: a reward, a new plan, a finished setup. Only the text is read; the stars are decoration. They stop
 * while the text is off screen and do not appear under reduced motion.
 */
export function SparkleText({ color = "var(--accent)", disabled = false, className, children, ...props }: SparkleTextProps) {
  const root = useRef<HTMLSpanElement>(null);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const element = root.current;
    if (!element || disabled || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    let visible = false;
    const tick = () => {
      const now = Date.now();
      setSparkles((list) => [...list.filter((s) => now - s.born < LIFE), make(now)]);
      timer = window.setTimeout(tick, random(90, 480));
    };
    const observer = new IntersectionObserver(([entry]) => {
      const next = !!entry?.isIntersecting;
      if (next === visible) return;
      visible = next;
      window.clearTimeout(timer);
      if (visible) tick();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      setSparkles([]);
    };
  }, [disabled]);

  return (
    <span ref={root} data-slot="sparkle-text" className={cn("relative inline-block", className)} {...props}>
      {sparkles.map((s) => (
        <svg key={s.id} data-slot="st-star" aria-hidden="true" viewBox="0 0 20 20" width={s.size} height={s.size} style={{ left: `${s.x}%`, top: `${s.y}%`, color: typeof color === "string" ? color : color[s.tint % color.length] } as CSSProperties}>
          <path d="M10 0Q11.3 8.7 20 10Q11.3 11.3 10 20Q8.7 11.3 0 10Q8.7 8.7 10 0Z" fill="currentColor" />
        </svg>
      ))}
      <span className="relative">{children}</span>
    </span>
  );
}
