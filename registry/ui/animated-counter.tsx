"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { cn } from "./lib/cn";
import { cssMs } from "./lib/motion-tokens";
import "./animated-counter.css";
function CounterDigit({
  digit,
  direction,
  reveal,
}: {
  digit: number;
  direction: "up" | "down" | "none";
  reveal: boolean;
}) {
  const column = useRef<HTMLSpanElement>(null),
    first = useRef(true);
  useLayoutEffect(() => {
    const element = column.current;
    if (!element) return;
    const animate = (initial = false) => {
      const tokens = getComputedStyle(element),
        height = element.parentElement!.getBoundingClientRect().height;
      const transform = tokens.transform;
      const offset =
        transform === "none"
          ? 20 + digit
          : -new DOMMatrixReadOnly(transform).m42 / height;
      const start = initial ? 20 : 20 + (((offset % 10) + 10) % 10);
      let end = 20 + digit;
      if (direction === "up" && end < start) end += 10;
      if (direction === "down" && end > start) end -= 10;
      element.getAnimations().forEach((animation) => animation.cancel());
      element.style.transform = `translateY(-${(20 + digit) * 1.2}em)`;
      if (
        !matchMedia("(prefers-reduced-motion: reduce)").matches &&
        (initial || direction !== "none")
      )
        element.animate(
          [
            { transform: `translateY(-${start * 1.2}em)` },
            { transform: `translateY(-${end * 1.2}em)` },
          ],
          {
            duration: cssMs(tokens.getPropertyValue("--duration-deliberate")),
            easing: tokens.getPropertyValue("--ease-out").trim(),
          },
        );
    };
    if (first.current) {
      first.current = false;
      element.style.transform = `translateY(-${(20 + digit) * 1.2}em)`;
      if (reveal) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              animate(true);
              observer.disconnect();
            }
          },
          { threshold: 0.6 },
        );
        observer.observe(element.parentElement!);
        return () => observer.disconnect();
      }
    } else animate();
  }, [digit, direction, reveal]);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const cancel = () => {
      if (preference.matches)
        column.current
          ?.getAnimations()
          .forEach((animation) => animation.cancel());
    };
    preference.addEventListener("change", cancel);
    return () => preference.removeEventListener("change", cancel);
  }, []);
  return (
    <span
      data-slot="counter-digit"
      className="inline-block h-[1.2em] w-[1ch] overflow-hidden"
    >
      <span
        ref={column}
        className="block"
        style={
          {
            transform: "translateY(calc(-1.2em * var(--counter-target)))",
            "--counter-target": 20 + digit,
          } as CSSProperties
        }
      >
        {Array.from({ length: 50 }, (_, i) => (
          <span key={i} className="block h-[1.2em] leading-[1.2]">
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  );
}
export function AnimatedCounter({
  value,
  label,
  prefix = "",
  suffix = "",
  decimals = 0,
  locale = "en-US",
  animateOnView = false,
  className,
}: {
  value: number;
  label?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  locale?: string;
  animateOnView?: boolean;
  className?: string;
}) {
  const shell = useRef<HTMLSpanElement>(null),
    content = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const measure = () => {
      if (shell.current && content.current)
        shell.current.style.width = `${content.current.offsetWidth}px`;
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, []);
  const [frame, setFrame] = useState({ value, prior: value });
  if (!Object.is(frame.value, value)) setFrame({ value, prior: frame.value });
  const direction =
    value > frame.prior ? "up" : value < frame.prior ? "down" : "none";
  const text = Number.isFinite(value)
    ? new Intl.NumberFormat(locale, {
        minimumFractionDigits: Math.max(0, Math.min(20, decimals)),
        maximumFractionDigits: Math.max(0, Math.min(20, decimals)),
      }).format(value)
    : "—";
  return (
    <span
      data-slot="animated-counter"
      className={cn("inline-flex flex-col min-w-0", className)}
    >
      {label && (
        <span className="mb-1 text-xs font-medium text-muted-foreground">
          {label}
        </span>
      )}
      <span className="sr-only">
        {prefix}
        {text}
        {suffix}
      </span>
      <span
        ref={shell}
        data-slot="counter-shell"
        aria-hidden="true"
        className="relative inline-block h-[1.2em] overflow-hidden"
      >
        <span
          ref={content}
          className="absolute right-0 inline-flex w-max items-center tabular-nums"
        >
          {prefix}
          {[...text].map((glyph, index) =>
            /\d/.test(glyph) ? (
              <CounterDigit
                key={`digit-${text.length - index}`}
                digit={Number(glyph)}
                direction={direction}
                reveal={animateOnView}
              />
            ) : (
              <span key={`separator-${text.length - index}`}>{glyph}</span>
            ),
          )}
          {suffix}
        </span>
      </span>
    </span>
  );
}
