"use client";
import { useEffect, useId, useState, type ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./cycling-placeholder.css";

export type CyclingPlaceholderProps = Omit<ComponentProps<"input">, "placeholder"> & {
  /** Examples shown in turn while the field is empty, such as "overdue invoices". */
  examples: string[];
  /** Words before each example, such as "Search for". */
  prefix?: string;
  /** Milliseconds each example stays. */
  interval?: number;
};

/**
 * A text field whose placeholder rolls through examples of what to type, so an empty search box teaches what it can
 * find. The roll pauses while the field has focus and the examples disappear once anything is typed. The field is
 * described by the first example, so assistive technology hears one stable hint. Under reduced motion the examples
 * cross-fade instead of rolling.
 */
export function CyclingPlaceholder({ examples, prefix = "", interval = 2600, className, value, defaultValue, onChange, onFocus, onBlur, ...props }: CyclingPlaceholderProps) {
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const [own, setOwn] = useState(String(defaultValue ?? ""));
  const text = value === undefined ? own : String(value);
  const hintId = useId();

  useEffect(() => {
    if (focused || text || examples.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % examples.length), interval);
    return () => window.clearInterval(timer);
  }, [focused, text, examples.length, interval]);

  return (
    <span data-slot="cycling-placeholder" className={cn("relative block", className)}>
      <input
        data-slot="cp-input"
        aria-describedby={examples[0] ? hintId : undefined}
        value={text}
        onChange={(event) => {
          if (value === undefined) setOwn(event.target.value);
          onChange?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
      <span id={hintId} className="sr-only">
        For example, {examples[0]}
      </span>
      {!text && (
        <span data-slot="cp-hint" aria-hidden="true">
          {prefix && <span>{prefix} </span>}
          <span data-slot="cp-window">
            <span key={index} data-slot="cp-example">
              {examples[index]}
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
