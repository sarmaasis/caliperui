"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "./lib/cn";
import { RollingValue } from "./rolling-value";
import "./shared/calendar-day.css";
import "./shared/chip-option.css";
import "./calendar.css";

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month: month - 1, day };
}

export function formatISODate(value: string) {
  const { year, month, day } = parseISODate(value);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(year, month, day));
}

export function shiftMonth(year: number, month: number, amount: number) {
  const date = new Date(year, month + amount, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function monthName(year: number, month: number) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(year, month, 1));
}

function buildDays(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells: { iso: string; day: number; outside: boolean }[] = [];
  for (let index = 0; index < first; index += 1) {
    const date = new Date(year, month, index - first + 1);
    cells.push({ iso: isoDate(date.getFullYear(), date.getMonth(), date.getDate()), day: date.getDate(), outside: true });
  }
  for (let day = 1; day <= count; day += 1) cells.push({ iso: isoDate(year, month, day), day, outside: false });
  while (cells.length % 7 !== 0) {
    const date = new Date(year, month + 1, cells.length - (first + count) + 1);
    cells.push({ iso: isoDate(date.getFullYear(), date.getMonth(), date.getDate()), day: date.getDate(), outside: true });
  }
  return cells;
}

function addDays(iso: string, amount: number) {
  const { year, month, day } = parseISODate(iso);
  const date = new Date(year, month, day + amount);
  return isoDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function blocked(iso: string, min?: string, max?: string, disabledDates?: (iso: string) => boolean) {
  if (min && iso < min) return true;
  if (max && iso > max) return true;
  return disabledDates?.(iso) ?? false;
}

export function Calendar({
  label,
  year,
  month,
  onMonthChange,
  selected,
  rangeStart,
  rangeEnd,
  onSelect,
  onHover,
  min,
  max,
  disabledDates,
  disabledReason,
  marks,
  showToday = false,
  className,
}: {
  label?: string;
  year?: number;
  month?: number;
  onMonthChange?: (year: number, month: number) => void;
  selected?: string | null;
  rangeStart?: string | null;
  rangeEnd?: string | null;
  onSelect?: (iso: string) => void;
  onHover?: (iso: string | null) => void;
  min?: string;
  max?: string;
  disabledDates?: (iso: string) => boolean;
  /** Read with an unavailable day, e.g. "banks closed". */
  disabledReason?: (iso: string) => string | undefined;
  /** A quiet data mark under the day, e.g. invoices due; the label is read with the date. */
  marks?: (iso: string) => string | undefined;
  showToday?: boolean;
  className?: string;
}) {
  const initial = selected ? parseISODate(selected) : { year: 2026, month: 9 };
  const [localYear, setLocalYear] = useState(initial.year);
  const [localMonth, setLocalMonth] = useState(initial.month);
  const [motion, setMotion] = useState<"next" | "prev">("next");
  const [selectionMarks, setSelectionMarks] = useState<Array<{ key: string; x: number; y: number; w: number; h: number }>>([]);
  const days = useRef<HTMLDivElement>(null);
  const pending = useRef<string | null>(null);
  const viewYear = year ?? localYear;
  const viewMonth = month ?? localMonth;
  const cells = buildDays(viewYear, viewMonth);
  const today = isoDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const prevMonth = shiftMonth(viewYear, viewMonth, -1);
  const following = shiftMonth(viewYear, viewMonth, 1);
  const prevDisabled = Boolean(min && isoDate(prevMonth.year, prevMonth.month, new Date(prevMonth.year, prevMonth.month + 1, 0).getDate()) < min);
  const nextDisabled = Boolean(max && isoDate(following.year, following.month, 1) > max);
  const start = rangeStart && rangeEnd && rangeStart > rangeEnd ? rangeEnd : rangeStart;
  const end = rangeStart && rangeEnd && rangeStart > rangeEnd ? rangeStart : rangeEnd;

  function setMonth(nextYear: number, nextMonth: number) {
    const forward = nextYear > viewYear || (nextYear === viewYear && nextMonth > viewMonth);
    setMotion(forward ? "next" : "prev");
    if (onMonthChange) onMonthChange(nextYear, nextMonth);
    else {
      setLocalYear(nextYear);
      setLocalMonth(nextMonth);
    }
  }

  function focusIso(iso: string) {
    const parsed = parseISODate(iso);
    if (parsed.year !== viewYear || parsed.month !== viewMonth) {
      pending.current = iso;
      setMonth(parsed.year, parsed.month);
      return;
    }
    days.current?.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)?.focus();
  }

  function nearestOpen(iso: string, step: number) {
    let next = iso;
    for (let guard = 0; guard < 42 && blocked(next, min, max, disabledDates); guard += 1) next = addDays(next, step);
    return blocked(next, min, max, disabledDates) ? null : next;
  }

  function move(event: KeyboardEvent<HTMLDivElement>) {
    const current = (document.activeElement as HTMLElement | null)?.dataset.date;
    if (!current) return;
    const { year: y, month: m, day } = parseISODate(current);
    const weekday = new Date(y, m, day).getDay();
    let step = 0;
    if (event.key === "ArrowRight") step = 1;
    else if (event.key === "ArrowLeft") step = -1;
    else if (event.key === "ArrowDown") step = 7;
    else if (event.key === "ArrowUp") step = -7;
    else if (event.key === "Home") step = -weekday;
    else if (event.key === "End") step = 6 - weekday;
    else if (event.key === "PageDown") step = event.shiftKey ? 365 : 30;
    else if (event.key === "PageUp") step = event.shiftKey ? -365 : -30;
    if (step === 0) return;
    event.preventDefault();
    const next = nearestOpen(addDays(current, step), step > 0 ? 1 : -1);
    if (next) focusIso(next);
  }

  useEffect(() => {
    const iso = pending.current;
    if (!iso) return;
    const button = days.current?.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`);
    if (!button) return;
    pending.current = null;
    button.focus();
  }, [viewYear, viewMonth, cells.length]);

  useLayoutEffect(() => {
    const root = days.current;
    if (!root) return;
    const ends = [selected, rangeStart, rangeEnd].filter((iso, index, list): iso is string => Boolean(iso) && list.indexOf(iso) === index);
    const next = ends.flatMap((iso) => {
      const node = root.querySelector<HTMLElement>(`[data-date="${iso}"]`);
      if (!node) return [];
      return [{ key: iso, x: node.offsetLeft, y: node.offsetTop, w: node.offsetWidth, h: node.offsetHeight }];
    });
    setSelectionMarks((current) => (current.length === next.length && current.every((mark, index) => mark.key === next[index]?.key && mark.x === next[index]?.x && mark.y === next[index]?.y) ? current : next));
  }, [selected, rangeStart, rangeEnd, viewYear, viewMonth, cells.length]);

  return (
    <div data-slot="calendar" className={cn("w-[17.5rem] max-w-full", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" aria-label="Previous month" aria-disabled={prevDisabled || undefined} disabled={prevDisabled} className="grid size-8 place-items-center rounded-control outline-none hover:bg-muted focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-35" onClick={() => { const next = shiftMonth(viewYear, viewMonth, -1); setMonth(next.year, next.month); }}>
          <ChevronLeft aria-hidden="true" className="size-4" />
        </button>
        <p className="text-sm font-semibold">
          <span className="sr-only" aria-live="polite">{monthName(viewYear, viewMonth)}</span>
          <RollingValue value={monthName(viewYear, viewMonth)} direction={motion === "next" ? "up" : "down"} />
        </p>
        <button type="button" aria-label="Next month" aria-disabled={nextDisabled || undefined} disabled={nextDisabled} className="grid size-8 place-items-center rounded-control outline-none hover:bg-muted focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-35" onClick={() => { const next = shiftMonth(viewYear, viewMonth, 1); setMonth(next.year, next.month); }}>
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div key={`${viewYear}-${viewMonth}`} role="grid" aria-label={label ?? monthName(viewYear, viewMonth)} data-slot="calendar-grid" data-motion={motion} onKeyDown={move} onMouseLeave={() => onHover?.(null)}>
        <div className="grid grid-cols-7" aria-hidden="true">
          {weekdays.map((day) => (
            <span key={day} className="grid h-8 place-items-center text-xs font-medium text-muted-foreground">{day}</span>
          ))}
        </div>
        <div ref={days} className="relative grid grid-cols-7">
          {Array.from({ length: cells.length / 7 }, (_, week) => {
            const row = cells.slice(week * 7, week * 7 + 7);
            const first = row.findIndex((cell) => start && end && cell.iso >= start && cell.iso <= end);
            let last = -1;
            for (let index = row.length - 1; index >= 0; index -= 1) {
              const cell = row[index];
              if (cell && start && end && cell.iso >= start && cell.iso <= end) {
                last = index;
                break;
              }
            }
            if (first < 0 || last < 0) return null;
            return <span key={week} aria-hidden="true" data-slot="calendar-range" style={{ top: week * 36, left: `${(first / 7) * 100}%`, width: `${((last - first + 1) / 7) * 100}%` }} />;
          })}
          {selectionMarks.map((mark) => (
            <span key={mark.key} aria-hidden="true" data-slot="calendar-selection" style={{ width: mark.w, height: mark.h, transform: `translate(${mark.x}px, ${mark.y}px)` }} />
          ))}
          {cells.map((cell) => {
            const inRange = Boolean(start && end && cell.iso >= start && cell.iso <= end);
            const isSelected = cell.iso === selected || cell.iso === rangeStart || cell.iso === rangeEnd;
            const isDisabled = blocked(cell.iso, min, max, disabledDates);
            const mark = marks?.(cell.iso);
            const reason = isDisabled ? disabledReason?.(cell.iso) : undefined;
            const tabIso = selected && cells.some((item) => item.iso === selected) ? selected : cells.find((item) => !item.outside && !blocked(item.iso, min, max, disabledDates))?.iso;
            return (
              <button
                key={cell.iso}
                type="button"
                role="gridcell"
                tabIndex={cell.iso === tabIso ? 0 : -1}
                data-date={cell.iso}
                data-slot="calendar-day"
                data-selected={isSelected || undefined}
                data-in-range={inRange || undefined}
                data-outside={cell.outside}
                aria-selected={isSelected}
                aria-current={cell.iso === today ? "date" : undefined}
                aria-disabled={isDisabled || undefined}
                aria-label={[formatISODate(cell.iso), mark, reason && `unavailable: ${reason}`].filter(Boolean).join(", ")}
                data-mark={mark ? true : undefined}
                className="relative z-10 grid aspect-square w-full max-w-9 place-items-center text-sm outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-disabled:opacity-35 data-[outside=true]:text-muted-foreground data-[selected=true]:text-accent-foreground"
                onMouseEnter={() => onHover?.(cell.iso)}
                onClick={() => {
                  if (!isDisabled) onSelect?.(cell.iso);
                }}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>
      {showToday && (
        <button type="button" className="mt-2 h-8 w-full rounded-surface text-sm font-medium outline-none hover:bg-muted focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-ring" onClick={() => {
          const now = new Date();
          const today = isoDate(now.getFullYear(), now.getMonth(), now.getDate());
          if (!blocked(today, min, max, disabledDates)) {
            setMonth(now.getFullYear(), now.getMonth());
            onSelect?.(today);
          }
        }}>
          Today
        </button>
      )}
    </div>
  );
}
