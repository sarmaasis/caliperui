"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Calendar, formatISODate, parseISODate } from "./calendar";
import { Label } from "./label";
import { RollingValue } from "./rolling-value";
import { cn } from "./lib/cn";
import "./shared/date-menu.css";

function DateParts({ value, direction }: { value: string; direction: "up" | "down" | "none" }) {
  const { year, month, day } = parseISODate(value);
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(year, month, day));
  return (
    <span className="inline-flex items-baseline gap-1">
      <RollingValue value={monthLabel} direction={direction} />
      <RollingValue value={String(day)} direction={direction} />
      <RollingValue value={String(year)} direction={direction} />
    </span>
  );
}

export function DatePicker({
  label,
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  showToday = true,
  name,
  disabled,
  className,
}: {
  label: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  min?: string;
  max?: string;
  showToday?: boolean;
  name?: string;
  disabled?: boolean;
  className?: string;
}) {
  const fieldId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [local, setLocal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"up" | "down" | "none">("none");
  const current = value === undefined ? local : value;

  function choose(next: string) {
    if (current) setDirection(next > current ? "up" : "down");
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
    window.setTimeout(() => setOpen(false), 240);
  }

  function clear() {
    setDirection("none");
    if (value === undefined) setLocal(null);
    onValueChange?.(null);
    setOpen(false);
  }


  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
    <div ref={root} className={cn("relative grid max-w-sm gap-1.5", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <PopoverPrimitive.Trigger asChild>
      <button
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-[var(--control-height)] items-center rounded-overlay border border-muted-foreground/75 bg-background px-3 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-45"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {current ? (
          <>
            <span className="sr-only">{formatISODate(current)}</span>
            <DateParts value={current} direction={direction} />
          </>
        ) : (
          <span className="text-muted-foreground">Select a date</span>
        )}
        <CalendarIcon aria-hidden="true" className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          aria-label={label}
          data-slot="date-menu"
          align="start"
          sideOffset={4}
          collisionPadding={12}
          className="z-50 max-h-[var(--radix-popover-content-available-height)] overflow-y-auto p-3 outline-none"
          onOpenAutoFocus={(event) => {
            // Land on the chosen day (or the first day) rather than the first button.
            const target = (event.currentTarget as HTMLElement | null)?.querySelector<HTMLButtonElement>(current ? `[data-date="${current}"]` : "[data-date]");
            if (target) {
              event.preventDefault();
              target.focus();
            }
          }}
        >
          <Calendar label={label} selected={current} onSelect={choose} min={min} max={max} showToday={showToday} />
          {current ? (
            <button type="button" className="mt-2 h-8 w-full rounded-surface text-sm font-medium outline-none hover:bg-muted focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-ring" onClick={clear}>
              Clear
            </button>
          ) : null}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
      {name ? <input type="hidden" name={name} value={current ?? ""} /> : null}
    </div>
    </PopoverPrimitive.Root>
  );
}
