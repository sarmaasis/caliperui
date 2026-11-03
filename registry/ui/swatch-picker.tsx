"use client";
import { useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from "react";
import { cn } from "./lib/cn";
import "./swatch-picker.css";

export type Swatch = { value: string; label: string; color: string };

export type SwatchPickerProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** Names the choice, e.g. "Label colour". */
  label: string;
  options: Swatch[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: "sm" | "md";
};

/**
 * A row of colour swatches with one selection ring that glides to the chosen colour, wrapping rows included. It is a
 * radio group: Tab lands on the chosen swatch, arrow keys move and choose, and each swatch is named by its label.
 * Under reduced motion the ring moves without travelling.
 */
export function SwatchPicker({ label, options, value, defaultValue, onValueChange, size = "md", className, style, ...props }: SwatchPickerProps) {
  const [own, setOwn] = useState(defaultValue ?? options[0]?.value);
  const current = value ?? own;
  const group = useRef<HTMLDivElement>(null);
  const [ring, setRing] = useState<{ x: number; y: number } | null>(null);

  const choose = (next: string) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  // The ring sits over the chosen swatch; measured, so wrapping and any gap stay right.
  useLayoutEffect(() => {
    const place = () => {
      const chosen = group.current?.querySelector<HTMLElement>('[aria-checked="true"]');
      setRing(chosen ? { x: chosen.offsetLeft, y: chosen.offsetTop } : null);
    };
    place();
    const observer = new ResizeObserver(place);
    if (group.current) observer.observe(group.current);
    return () => observer.disconnect();
  }, [current, options]);

  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    const index = options.findIndex((option) => option.value === current);
    let next = step === undefined ? -1 : (index + step + options.length) % options.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = options.length - 1;
    if (next < 0) return;
    event.preventDefault();
    choose(options[next].value);
    group.current?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      data-slot="swatch-picker"
      data-size={size}
      className={cn("relative flex flex-wrap", className)}
      style={style}
      onKeyDown={key}
      {...props}
    >
      {ring && <span data-slot="sp-ring" aria-hidden="true" style={{ translate: `${ring.x}px ${ring.y}px`, "--sp-color": options.find((option) => option.value === current)?.color } as CSSProperties} />}
      {options.map((option) => {
        const checked = option.value === current;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.label}
            title={option.label}
            tabIndex={checked ? 0 : -1}
            data-slot="sp-swatch"
            style={{ "--sp-color": option.color } as CSSProperties}
            onClick={() => choose(option.value)}
          />
        );
      })}
    </div>
  );
}
