"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "./lib/cn";
import "./shared/segmented-plate.css";

/** With an icon, the option shows only the icon and `label` becomes its accessible name and tooltip. */
export type SegmentedOption = { value: string; label: string; icon?: ReactNode };

export function SegmentedControl({
  label,
  value,
  onValueChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SegmentedOption[];
  className?: string;
}) {
  const group = useRef<HTMLDivElement>(null);
  const [initialValue] = useState(value);
  const [indicator, setIndicator] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  useLayoutEffect(() => {
    const element = group.current;
    if (!element) return;
    const measure = () => {
      const active = element.querySelector<HTMLElement>('[aria-checked="true"]');
      setIndicator(
        active
          ? {
              left: active.offsetLeft,
              top: active.offsetTop,
              width: active.offsetWidth,
              height: active.offsetHeight,
            }
          : null,
      );
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    element
      .querySelectorAll('[role="radio"]')
      .forEach((item) => resize.observe(item));
    return () => resize.disconnect();
  }, [value, options]);

  function move(event: KeyboardEvent<HTMLDivElement>) {
    const index = options.findIndex((item) => item.value === value);
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (index + 1) % options.length
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (index - 1 + options.length) % options.length
          : -1;
    if (next < 0) return;
    event.preventDefault();
    onValueChange(options[next].value);
    group.current
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [next]?.focus();
  }

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      data-slot="segmented"
      onKeyDown={move}
      className={cn(
        // Too many options for a narrow screen scroll sideways instead of spilling out.
        "relative inline-flex max-w-full overflow-x-auto rounded-touch bg-sunken p-[3px] shadow-sunken [scrollbar-width:none]",
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden="true"
          data-slot="segmented-indicator"
          style={{
            width: indicator.width,
            height: indicator.height,
            transform: `translate(${indicator.left}px, ${indicator.top}px)`,
          }}
        >
          <span
            key={value}
            data-slot="segmented-plate"
            data-moved={value !== initialValue}
          />
        </span>
      )}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            aria-label={option.icon ? option.label : undefined}
            title={option.icon ? option.label : undefined}
            onClick={() => onValueChange(option.value)}
            className="relative z-10 inline-flex shrink-0 h-[calc(var(--control-height)-6px)] min-w-10 items-center justify-center rounded-[calc(var(--radius-touch)-3px)] px-3 text-[13px] font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring aria-checked:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0"
          >
            {option.icon ?? option.label}
          </button>
        );
      })}
    </div>
  );
}
