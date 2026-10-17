"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { useId, useState } from "react";
import { Calendar, formatISODate, parseISODate, shiftMonth } from "./calendar";
import { Label } from "./label";
import { cn } from "./lib/cn";
import "./shared/date-menu.css";

export type DateRange = { start: string | null; end: string | null };

export type DateRangePreset = { id: string; label: string; start: string; end: string };

function addDays(iso: string, amount: number) {
  const { year, month, day } = parseISODate(iso);
  const date = new Date(year, month, day + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function DateRangePicker({
  label,
  value,
  defaultValue = { start: null, end: null },
  onValueChange,
  presets,
  name,
  disabled,
  className,
}: {
  label: string;
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (value: DateRange) => void;
  presets?: readonly DateRangePreset[];
  name?: string;
  disabled?: boolean;
  className?: string;
}) {
  const fieldId = useId();
  const rootId = useId();
  const [local, setLocal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [anchor, setAnchor] = useState(() => {
    const seed = defaultValue.start ?? "2026-10-08";
    const parsed = parseISODate(seed);
    return { year: parsed.year, month: parsed.month };
  });
  const current = value ?? local;
  const shown = open && draft ? draft : current;
  const nextMonth = shiftMonth(anchor.year, anchor.month, 1);
  const previewEnd = shown.end ?? (shown.start ? hover : null);
  const summary = current.start && current.end ? `${formatISODate(current.start)} – ${formatISODate(current.end)}` : "Select dates";
  const dayCount = shown.start && previewEnd ? Math.round((Date.parse(previewEnd > shown.start ? previewEnd : shown.start) - Date.parse(previewEnd > shown.start ? shown.start : previewEnd)) / 86400000) + 1 : 0;

  function commit(next: DateRange) {
    if (value == null) setLocal(next);
    onValueChange?.(next);
  }

  function openPanel() {
    setDraft(current);
    setHover(null);
    if (current.start) {
      const parsed = parseISODate(current.start);
      setAnchor({ year: parsed.year, month: parsed.month });
    }
    setOpen(true);
  }

  function close(apply: boolean) {
    if (apply && draft?.start && draft.end) commit(draft);
    setDraft(null);
    setHover(null);
    setOpen(false);
  }

  function pick(iso: string) {
    const base = draft ?? current;
    if (!base.start || base.end) {
      setHover(null);
      setDraft({ start: iso, end: null });
      return;
    }
    const next = iso < base.start ? { start: iso, end: base.start } : { start: base.start, end: iso };
    setHover(null);
    setDraft(next);
  }


  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(next) => (next ? openPanel() : close(false))}>
    <div id={rootId} className={cn("relative grid max-w-3xl gap-1.5", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <PopoverPrimitive.Trigger asChild>
      <button
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-[var(--control-height)] w-full max-w-sm items-center rounded-overlay border border-muted-foreground/75 bg-background px-3 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-45"
      >
        <span className={cn("truncate", !(current.start && current.end) && "text-muted-foreground")}>{summary}</span>
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
          className="z-50 max-h-[var(--radix-popover-content-available-height)] w-max max-w-[calc(100vw-24px)] overflow-y-auto p-3 outline-none"
        >
          {presets && presets.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="h-8 rounded-full border border-border px-3 text-xs font-medium outline-none hover:bg-muted focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-ring"
                  onClick={() => {
                    setDraft({ start: preset.start, end: preset.end });
                    const parsed = parseISODate(preset.start);
                    setAnchor({ year: parsed.year, month: parsed.month });
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-6 min-[720px]:grid-cols-2">
            <Calendar
              year={anchor.year}
              month={anchor.month}
              onMonthChange={(year, month) => setAnchor({ year, month })}
              rangeStart={shown.start}
              rangeEnd={previewEnd}
              onHover={setHover}
              onSelect={pick}
            />
            <Calendar
              className="max-[719px]:hidden"
              year={nextMonth.year}
              month={nextMonth.month}
              onMonthChange={(year, month) => setAnchor(shiftMonth(year, month, -1))}
              rangeStart={shown.start}
              rangeEnd={previewEnd}
              onHover={setHover}
              onSelect={pick}
            />
          </div>
          <p className="sr-only" role="status">{shown.start && previewEnd ? `${formatISODate(shown.start)} to ${formatISODate(previewEnd)}, ${dayCount} days.` : shown.start ? `Starts ${formatISODate(shown.start)}.` : "No dates selected."}</p>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="h-8 rounded-surface px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-ring" onClick={() => close(false)}>Cancel</button>
            <button type="button" className="h-8 rounded-surface bg-foreground px-3 text-sm font-medium text-background outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-45" disabled={!draft?.start || !draft.end} onClick={() => close(true)}>Apply</button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
      {name && current.start ? <input type="hidden" name={`${name}-start`} value={current.start} /> : null}
      {name && current.end ? <input type="hidden" name={`${name}-end`} value={current.end} /> : null}
    </div>
    </PopoverPrimitive.Root>
  );
}

export { addDays };
