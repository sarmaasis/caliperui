"use client";

import { useState, type KeyboardEvent } from "react";
import { cn } from "./lib/cn";
import "./shared/chip-option.css";

export type ChipOption = { value: string; label: string; disabled?: boolean };

export function ChipGroup({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  selection = "multiple",
  name,
  className,
}: {
  label: string;
  options: readonly ChipOption[];
  value?: string | readonly string[];
  defaultValue?: string | readonly string[];
  onValueChange?: (value: string | string[]) => void;
  selection?: "single" | "multiple";
  name?: string;
  className?: string;
}) {
  const initial = defaultValue ?? (selection === "single" ? options[0]?.value ?? "" : []);
  const [local, setLocal] = useState(initial);
  const current = value ?? local;
  const picked = new Set(Array.isArray(current) ? current : [current]);

  function commit(next: string | string[]) {
    if (value == null) setLocal(next);
    onValueChange?.(next);
  }

  function toggle(option: ChipOption) {
    if (option.disabled) return;
    if (selection === "single") {
      commit(option.value);
      return;
    }
    const list = Array.isArray(current) ? [...current] : [];
    commit(list.includes(option.value) ? list.filter((item) => item !== option.value) : [...list, option.value]);
  }

  function move(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([aria-disabled=true])")];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    const next = event.key === "ArrowRight" || event.key === "ArrowDown" ? index + 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? index - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    buttons[(next + buttons.length) % buttons.length]?.focus();
  }

  const hidden = selection === "single" ? [String(current)] : Array.isArray(current) ? [...current] : [];

  return (
    <div className={cn("grid gap-2", className)}>
      <div
        role={selection === "single" ? "radiogroup" : "group"}
        aria-label={label}
        className="flex flex-wrap gap-2"
        onKeyDown={move}
      >
        {options.map((option) => {
          const on = picked.has(option.value);
          return (
            <button
              key={option.value}
              data-slot="chip-option"
              type="button"
              role={selection === "single" ? "radio" : undefined}
              aria-checked={selection === "single" ? on : undefined}
              aria-pressed={selection === "multiple" ? on : undefined}
              aria-disabled={option.disabled || undefined}
              className="h-[var(--control-height)] rounded-full border border-border px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-checked:border-accent aria-checked:bg-accent aria-checked:text-accent-foreground aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-foreground aria-disabled:opacity-45"
              onClick={() => toggle(option)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {name ? hidden.map((item) => <input key={item} type="hidden" name={name} value={item} />) : null}
    </div>
  );
}
