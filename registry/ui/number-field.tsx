"use client";

import { Minus, Plus } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useHoldStep } from "./lib/hold-step";
import { Label } from "./label";
import { cn } from "./lib/cn";
import { RollingValue } from "./rolling-value";
import "./number-field.css";

function places(step: number) {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : text.length - dot - 1;
}

function clean(value: number, step: number) {
  return Number(value.toFixed(places(step)));
}

function textOf(value: number, prefix: string, suffix: string) {
  return `${prefix}${value}${suffix}`;
}

export function NumberField({
  label,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  prefix = "",
  suffix,
  scrub = false,
  disabled,
  name,
  id,
  onValueChange,
  className,
}: {
  label: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string | ((value: number) => string);
  scrub?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  onValueChange?: (value: number) => void;
  className?: string;
}) {
  const generated = useId();
  const fieldId = id ?? generated;
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  const initial = clean(Math.min(upper, Math.max(lower, defaultValue ?? lower)), step);
  const [local, setLocal] = useState(initial);
  const current = value ?? local;
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [direction, setDirection] = useState<"up" | "down" | "none">("none");
  const [strain, setStrain] = useState<"min" | "max" | null>(null);
  const [hint, setHint] = useState("");
  const hintTimer = useRef<number | null>(null);
  const strainTimer = useRef<number | null>(null);
  const scrubOrigin = useRef<{ x: number; value: number } | null>(null);
  const suffixText = typeof suffix === "function" ? suffix(current) : (suffix ?? "");
  const shown = draft ?? current.toFixed(places(step));
  const parsed = Number(shown);
  const outside = shown !== "" && Number.isFinite(parsed) && (parsed < lower || parsed > upper);

  function note(edge: "min" | "max") {
    const limit = edge === "max" ? upper : lower;
    const end = typeof suffix === "function" ? suffix(limit) : (suffix ?? "");
    setHint(edge === "max" ? `Maximum is ${textOf(limit, prefix, end)}` : `Minimum is ${textOf(limit, prefix, end)}`);
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(""), 1500);
  }

  function push(edge: "min" | "max") {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStrain(edge);
      if (strainTimer.current) window.clearTimeout(strainTimer.current);
      strainTimer.current = window.setTimeout(() => setStrain(null), 180);
    }
    note(edge);
  }

  function commit(next: number, way: "up" | "down" | "none") {
    const clamped = clean(Math.min(upper, Math.max(lower, next)), step);
    if (clamped === current) {
      if (next < lower || next > upper) push(next > upper ? "max" : "min");
      setDraft(null);
      return clamped;
    }
    setDirection(way);
    setDraft(null);
    if (value == null) setLocal(clamped);
    onValueChange?.(clamped);
    return clamped;
  }

  function move(way: 1 | -1) {
    const next = clean(current + way * step, step);
    if (next > upper || next < lower || next === current) push(way > 0 ? "max" : "min");
    else commit(next, way > 0 ? "up" : "down");
  }

  const decrease = useHoldStep(() => move(-1));
  const increase = useHoldStep(() => move(1));

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      commit(lower, "down");
    } else if (event.key === "End") {
      event.preventDefault();
      commit(upper, "up");
    } else if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  }

  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label
          htmlFor={fieldId}
          className={cn(scrub && !disabled && "cursor-ew-resize")}
          onPointerDown={(event) => {
            if (!scrub || disabled || event.button !== 0) return;
            scrubOrigin.current = { x: event.clientX, value: current };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const origin = scrubOrigin.current;
            if (!origin) return;
            const steps = Math.round((event.clientX - origin.x) / 12);
            commit(origin.value + steps * step, steps >= 0 ? "up" : "down");
          }}
          onPointerUp={() => {
            scrubOrigin.current = null;
          }}
        >
          {label}
        </Label>
        <p role="status" className="text-xs leading-[18px] text-muted-foreground">
          {hint}
        </p>
      </div>
      <div
        data-slot="number-field"
        data-strain={strain ?? undefined}
        data-invalid={outside || undefined}
        className="inline-flex h-[var(--control-height)] items-stretch overflow-hidden rounded-overlay border border-muted-foreground/75 bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background data-[invalid]:border-warning"
      >
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          aria-disabled={disabled || current <= lower}
          disabled={disabled}
          className="grid w-9 place-items-center text-muted-foreground outline-none hover:text-foreground focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-disabled:opacity-45"
          {...decrease}
        >
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <div className="flex min-w-16 flex-1 items-center justify-center">
          {prefix ? <span className="pl-1 text-sm text-muted-foreground">{prefix}</span> : null}
          <div className="relative h-full min-w-8 flex-1">
            <input
              id={fieldId}
              name={name}
              role="spinbutton"
              inputMode={places(step) ? "decimal" : "numeric"}
              disabled={disabled}
              aria-valuenow={current}
              aria-valuemin={lower}
              aria-valuemax={upper}
              aria-valuetext={textOf(current, prefix, suffixText)}
              value={shown}
              className={cn(
                "h-full w-full min-w-8 bg-transparent text-center text-sm font-medium tabular-nums outline-none",
                !focused && "text-transparent caret-transparent",
              )}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                const next = Number(draft ?? current);
                if (!Number.isFinite(next)) {
                  setDraft(null);
                  return;
                }
                commit(next, next > current ? "up" : next < current ? "down" : "none");
              }}
              onChange={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={onKeyDown}
            />
            {!focused ? (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
                <RollingValue value={current.toFixed(places(step))} direction={direction} />
              </span>
            ) : null}
          </div>
          {suffixText ? <span className="pr-1 text-sm text-muted-foreground">{suffixText}</span> : null}
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          aria-disabled={disabled || current >= upper}
          disabled={disabled}
          className="grid w-9 place-items-center text-muted-foreground outline-none hover:text-foreground focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-disabled:opacity-45"
          {...increase}
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}
