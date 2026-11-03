"use client";
import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { cn } from "./lib/cn";
import { SegmentedControl } from "./segmented-control";
import "./unit-field.css";

/** A unit as a straight line from a base unit: base = value × factor + offset. */
export type FieldUnit = { value: string; label: string; factor: number; offset?: number; decimals?: number };

export const toBase = (value: number, unit: FieldUnit) => value * unit.factor + (unit.offset ?? 0);
export const fromBase = (base: number, unit: FieldUnit) => (base - (unit.offset ?? 0)) / unit.factor;

export type UnitFieldProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> & {
  label: string;
  units: FieldUnit[];
  /** The amount in the base unit (the unit whose factor is 1). */
  value?: number;
  defaultValue?: number;
  onValueChange?: (base: number) => void;
  defaultUnit?: string;
};

/**
 * A number field with its unit beside it. Switching the unit converts the amount, and the figure counts across to
 * the new value rather than jumping, so it is clear the quantity is the same. The value is kept in a base unit, so
 * switching back and forth never drifts. Under reduced motion the figure changes at once.
 */
export function UnitField({ label, units, value, defaultValue = 0, onValueChange, defaultUnit, className, ...props }: UnitFieldProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultValue);
  const base = value ?? own;
  const [unitValue, setUnitValue] = useState(defaultUnit ?? units[0].value);
  const unit = units.find((u) => u.value === unitValue) ?? units[0];
  const round = (n: number, u = unit) => Number(n.toFixed(u.decimals ?? 1));
  // What is typed, or the figure mid-count; otherwise the field shows the value, so outside changes appear.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? String(round(fromBase(base, unit)));
  const tween = useRef(0);
  useEffect(() => () => cancelAnimationFrame(tween.current), []);

  const switchTo = (next: string) => {
    const to = units.find((u) => u.value === next)!;
    const from = Number(text) || 0;
    const target = round(fromBase(base, to), to);
    setUnitValue(next);
    cancelAnimationFrame(tween.current);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setDraft(null);
    let start = -1;
    const step = (now: number) => {
      if (start < 0) start = now;
      const t = Math.min(1, (now - start) / 420);
      const eased = 1 - Math.pow(1 - t, 3);
      setDraft(String(Number((from + (target - from) * eased).toFixed(to.decimals ?? 1))));
      if (t < 1) tween.current = requestAnimationFrame(step);
      else {
        tween.current = 0;
        setDraft(null);
      }
    };
    tween.current = requestAnimationFrame(step);
  };

  const type = (next: string) => {
    setDraft(next);
    const number = Number(next);
    if (next.trim() === "" || !Number.isFinite(number)) return;
    const nextBase = toBase(number, unit);
    if (value === undefined) setOwn(nextBase);
    onValueChange?.(nextBase);
  };

  return (
    <div data-slot="unit-field" className={cn("grid gap-2", className)} {...props}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div data-slot="uf-box">
          <input
            id={id}
            inputMode="decimal"
            data-slot="uf-input"
            value={text}
            aria-describedby={`${id}-unit`}
            onBlur={() => setDraft(null)}
            onChange={(event) => type(event.target.value)}
          />
          <span id={`${id}-unit`} data-slot="uf-suffix">
            {unit.label}
          </span>
        </div>
        <SegmentedControl label={`${label} unit`} value={unit.value} onValueChange={switchTo} options={units.map((u) => ({ value: u.value, label: u.label }))} />
      </div>
    </div>
  );
}
