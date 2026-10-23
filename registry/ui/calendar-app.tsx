"use client";

import { ChevronLeft, ChevronRight, MapPin, Plus, SlidersHorizontal } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Checkbox } from "./checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Field } from "./field";
import { Input } from "./input";
import { addMinutes, dayKey, formatLocal, hm, layoutColumns, minutesOf, parseLocal, startOfWeek } from "./lib/calendar-time";
import { cn } from "./lib/cn";
import { useSlideOnChange } from "./lib/slide";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { SegmentedControl } from "./segmented-control";
import { SelectMenu } from "./select-menu";
import { Switch } from "./switch";
import { Textarea } from "./textarea";
import "./shared/styles-4.css";
import "./calendar-app.css";

export type CalendarSource = { id: string; label: string; /** Chart colour 1–6. */ tone: 1 | 2 | 3 | 4 | 5 | 6 };
export type CalendarAppEvent = {
  id: string;
  title: string;
  /** Local date-time, "2026-10-14T09:30". All-day events use 00:00. */
  start: string;
  end: string;
  calendar: string;
  allDay?: boolean;
  location?: string;
  notes?: string;
};
export type CalendarView = "day" | "week" | "month" | "agenda";

const HOUR = 48;
const SNAP = 15;
const snap = (minutes: number) => Math.round(minutes / SNAP) * SNAP;
const longDay = (date: Date) => date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
const plusDays = (date: Date, days: number) => addMinutes(date, 0, days);
let seq = 0;
const newEventId = () => `ev-${Date.now().toString(36)}-${(seq += 1)}`;

/* The clock in whole minutes, for the now line; the server has none. */
const minutes = {
  subscribe(notify: () => void) {
    const timer = window.setInterval(notify, 15_000);
    return () => window.clearInterval(timer);
  },
  get: () => Math.floor(Date.now() / 60_000) * 60_000,
  server: () => 0,
};

type Draft = { id?: string; title: string; date: string; start: string; end: string; calendar: string; allDay: boolean; location: string; notes: string };
type Drag = { id: string; mode: "move" | "size" | "create"; x: number; y: number; origin: { start: Date; end: Date }; start: Date; end: Date; moved: boolean };

/**
 * A full calendar for planning time: day, week, month and agenda views, a
 * month picker and calendar toggles beside them, and a now line that moves.
 * Drag across empty time to create an event, drag one to move it, drag its
 * edge to change its length, or focus it and use Alt with the arrows. On a
 * narrow screen the week shows three days and the side panel folds away.
 */
export function CalendarApp({
  events,
  calendars,
  onEventsChange,
  today = dayKey(new Date()),
  now,
  defaultView = "week",
  weekStart = 0,
  className,
}: {
  events: readonly CalendarAppEvent[];
  calendars: readonly CalendarSource[];
  onEventsChange: (events: CalendarAppEvent[]) => void;
  /** ISO date treated as today. */
  today?: string;
  /** Local date-time for the now line; defaults to the clock. */
  now?: string;
  defaultView?: CalendarView;
  /** 0 starts weeks on Sunday, like the month picker beside it; 1 on Monday. */
  weekStart?: 0 | 1;
  className?: string;
}) {
  const id = useId();
  const [view, setView] = useState<CalendarView>(defaultView);
  const [anchor, setAnchor] = useState(today);
  // A new range slides in from the side you moved to; a new view fades (lib/slide).
  const { ref: body, toward } = useSlideOnChange(`${view}|${anchor}`);
  const [hidden, setHidden] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announce, setAnnounce] = useState("");
  const [narrow, setNarrow] = useState(false);
  const minute = useSyncExternalStore(minutes.subscribe, minutes.get, minutes.server);
  const clock = now ? parseLocal(now) : minute ? new Date(minute) : null;
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setNarrow(entry!.contentRect.width < 640));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (grid.current) grid.current.scrollTop = 7.5 * HOUR;
  }, [view]);

  const anchorDate = parseLocal(anchor);
  const days = useMemo(() => {
    if (view === "day") return [anchorDate];
    if (view === "week") {
      if (narrow) return [0, 1, 2].map((n) => plusDays(anchorDate, n));
      const first = startOfWeek(anchorDate, weekStart);
      return Array.from({ length: 7 }, (_, n) => plusDays(first, n));
    }
    return [];
  }, [view, anchor, narrow, weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = events.filter((event) => !hidden.includes(event.calendar));
  const tone = (event: CalendarAppEvent) => calendars.find((source) => source.id === event.calendar)?.tone ?? 1;
  const onDay = (date: Date) => visible.filter((event) => dayKey(parseLocal(event.start)) === dayKey(date));

  const title = (() => {
    if (view === "day") return longDay(anchorDate);
    if (view === "month" || view === "agenda") return anchorDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const a = days[0]!;
    const b = days[days.length - 1]!;
    return a.getMonth() === b.getMonth()
      ? `${a.getDate()}–${b.getDate()} ${b.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
      : `${a.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${b.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  })();

  function go(step: number) {
    toward(step);
    const next =
      view === "day" ? plusDays(anchorDate, step) : view === "week" ? plusDays(anchorDate, step * (narrow ? 3 : 7)) : new Date(anchorDate.getFullYear(), anchorDate.getMonth() + step, 1);
    setAnchor(dayKey(next));
  }

  function save(event: CalendarAppEvent) {
    const exists = events.some((item) => item.id === event.id);
    onEventsChange(exists ? events.map((item) => (item.id === event.id ? event : item)) : [...events, event]);
  }

  function openEditor(next: Draft, from?: HTMLElement | null) {
    opener.current = from ?? (document.activeElement as HTMLElement | null);
    setDraft(next);
  }
  const draftFor = (event: CalendarAppEvent): Draft => ({
    id: event.id,
    title: event.title,
    date: event.start.slice(0, 10),
    start: event.start.slice(11, 16),
    end: event.end.slice(11, 16),
    calendar: event.calendar,
    allDay: !!event.allDay,
    location: event.location ?? "",
    notes: event.notes ?? "",
  });
  const newDraft = (start: Date, end: Date, allDay = false): Draft => ({ title: "", date: dayKey(start), start: hm(start), end: hm(end), calendar: calendars.find((source) => !hidden.includes(source.id))?.id ?? calendars[0]!.id, allDay, location: "", notes: "" });

  function keys(event: KeyboardEvent, item: CalendarAppEvent) {
    if (!event.altKey || item.allDay) return;
    const start = parseLocal(item.start);
    const end = parseLocal(item.end);
    let next: [Date, Date] | null = null;
    if (event.shiftKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      const finish = addMinutes(end, event.key === "ArrowUp" ? -SNAP : SNAP);
      if (finish.getTime() - start.getTime() >= SNAP * 60_000) next = [start, finish];
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const delta = event.key === "ArrowUp" ? -SNAP : SNAP;
      next = [addMinutes(start, delta), addMinutes(end, delta)];
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const delta = event.key === "ArrowLeft" ? -1 : 1;
      next = [addMinutes(start, 0, delta), addMinutes(end, 0, delta)];
    }
    if (!next) return;
    event.preventDefault();
    save({ ...item, start: formatLocal(next[0]), end: formatLocal(next[1]) });
    setAnnounce(`${item.title}: ${longDay(next[0])}, ${hm(next[0])} to ${hm(next[1])}.`);
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-event="${item.id}"]`)?.focus());
  }

  /* ----- Pointer: create, move, resize ----- */
  const columnWidth = () => grid.current?.querySelector<HTMLElement>("[data-day]")?.getBoundingClientRect().width ?? 1;
  function startCreate(event: PointerEvent<HTMLDivElement>, date: Date) {
    if (event.button !== 0 || event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const minutes = Math.floor((((event.clientY - rect.top) / HOUR) * 60) / SNAP) * SNAP;
    const start = addMinutes(new Date(date.getFullYear(), date.getMonth(), date.getDate()), minutes);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ id: "new", mode: "create", x: event.clientX, y: event.clientY, origin: { start, end: addMinutes(start, 30) }, start, end: addMinutes(start, 30), moved: false });
  }
  function startDrag(event: PointerEvent<HTMLElement>, item: CalendarAppEvent, mode: "move" | "size") {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const origin = { start: parseLocal(item.start), end: parseLocal(item.end) };
    setDrag({ id: item.id, mode, x: event.clientX, y: event.clientY, origin, ...origin, moved: false });
  }
  function moveDrag(event: PointerEvent<HTMLElement>) {
    if (!drag) return;
    const minutes = snap(((event.clientY - drag.y) / HOUR) * 60);
    const moved = drag.moved || Math.abs(event.clientY - drag.y) > 4 || Math.abs(event.clientX - drag.x) > 4;
    if (drag.mode === "move") {
      const dayShift = Math.round((event.clientX - drag.x) / columnWidth());
      setDrag({ ...drag, moved, start: addMinutes(drag.origin.start, minutes, dayShift), end: addMinutes(drag.origin.end, minutes, dayShift) });
    } else {
      const end = addMinutes(drag.mode === "create" ? drag.origin.start : drag.origin.end, drag.mode === "create" ? Math.max(SNAP, minutes + SNAP) : minutes);
      if (end.getTime() - drag.start.getTime() >= SNAP * 60_000) setDrag({ ...drag, moved, end });
    }
  }
  function endDrag(event: PointerEvent<HTMLElement>) {
    if (!drag) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const current = drag;
    setDrag(null);
    if (current.mode === "create") {
      const end = current.moved ? current.end : addMinutes(current.start, 30);
      return openEditor(newDraft(current.start, end), event.currentTarget);
    }
    const item = events.find((candidate) => candidate.id === current.id);
    if (!item) return;
    if (!current.moved) return openEditor(draftFor(item), event.currentTarget);
    save({ ...item, start: formatLocal(current.start), end: formatLocal(current.end) });
    setAnnounce(`${item.title} moved to ${longDay(current.start)}, ${hm(current.start)} to ${hm(current.end)}.`);
  }

  const nowLine = clock && <span data-slot="cal-now" style={{ top: (minutesOf(clock) / 60) * HOUR }} aria-hidden="true" />;

  return (
    <div ref={root} data-slot="cal-app" className={cn("@container grid min-w-0 gap-4", className)}>
      <div data-slot="cal-toolbar">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="secondary" onClick={() => { toward(today < anchor ? -1 : today > anchor ? 1 : 0); setAnchor(today); }}>Today</Button>
          <Button size="sm" variant="ghost" aria-label={`Previous ${view === "month" || view === "agenda" ? "month" : view === "day" ? "day" : "days"}`} onClick={() => go(-1)}><ChevronLeft aria-hidden="true" /></Button>
          <Button size="sm" variant="ghost" aria-label={`Next ${view === "month" || view === "agenda" ? "month" : view === "day" ? "day" : "days"}`} onClick={() => go(1)}><ChevronRight aria-hidden="true" /></Button>
        </div>
        <h2 id={`${id}-title`} className="min-w-0 flex-1 truncate text-base font-semibold" aria-live="polite">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl label="View" value={view} onValueChange={(value) => setView(value as CalendarView)} options={[{ value: "day", label: "Day" }, { value: "week", label: narrow ? "3 days" : "Week" }, { value: "month", label: "Month" }, { value: "agenda", label: "Agenda" }]} />
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" data-slot="cal-filter-button" aria-label="Calendars"><SlidersHorizontal aria-hidden="true" /></Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <Sources calendars={calendars} hidden={hidden} setHidden={setHidden} />
            </PopoverContent>
          </Popover>
          <Button size="sm" onClick={(e) => { const start = addMinutes(new Date(anchorDate), 9 * 60); openEditor(newDraft(start, addMinutes(start, 30)), e.currentTarget); }}>
            <Plus aria-hidden="true" />
            New event
          </Button>
        </div>
      </div>

      <div data-slot="cal-body">
        <aside data-slot="cal-side" aria-label="Date and calendars">
          <Calendar
            label="Go to date"
            year={anchorDate.getFullYear()}
            month={anchorDate.getMonth()}
            onMonthChange={(year, month) => setAnchor(dayKey(new Date(year, month, 1)))}
            selected={anchor}
            onSelect={(iso) => setAnchor(iso)}
            marks={(iso) => (events.some((event) => event.start.startsWith(iso)) ? "has events" : undefined)}
            showToday
          />
          <Sources calendars={calendars} hidden={hidden} setHidden={setHidden} />
        </aside>

        <div ref={body} className="min-w-0">
          {(view === "day" || view === "week") && (
            <div data-slot="cal-frame" style={{ ["--cal-days" as string]: days.length }}>
              <div data-slot="cal-head">
                <span />
                {days.map((date) => (
                  <button key={dayKey(date)} type="button" data-today={dayKey(date) === today || undefined} onClick={() => { setAnchor(dayKey(date)); setView("day"); }} aria-label={`${longDay(date)}, open day`}>
                    <span>{date.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                    <b>{date.getDate()}</b>
                  </button>
                ))}
              </div>
              <div data-slot="cal-allday">
                <span>All day</span>
                {days.map((date) => (
                  <div key={dayKey(date)}>
                    {onDay(date).filter((event) => event.allDay).map((event) => (
                      <button key={event.id} type="button" data-event={event.id} data-slot="cal-chip" style={{ ["--tone" as string]: `var(--chart-${tone(event)})` }} onClick={(e) => openEditor(draftFor(event), e.currentTarget)}>
                        {event.title}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <div ref={grid} data-slot="cal-grid" role="grid" aria-labelledby={`${id}-title`} aria-describedby={`${id}-help`}>
                <div data-slot="cal-hours" aria-hidden="true">
                  {Array.from({ length: 24 }, (_, hour) => <span key={hour}>{hour === 0 ? "" : `${String(hour).padStart(2, "0")}:00`}</span>)}
                </div>
                {days.map((date) => {
                  const key = dayKey(date);
                  const timed = visible
                    .filter((event) => !event.allDay)
                    .map((event) => {
                      const live = drag && drag.id === event.id && drag.mode !== "create" ? drag : null;
                      const start = live?.start ?? parseLocal(event.start);
                      const end = live?.end ?? parseLocal(event.end);
                      return { event, start, end, s: minutesOf(start), f: Math.max(minutesOf(start) + SNAP, dayKey(end) !== dayKey(start) ? 24 * 60 : minutesOf(end)) };
                    })
                    .filter((item) => dayKey(item.start) === key);
                  return (
                    <div key={key} data-day={key} role="row" aria-label={longDay(date)} onPointerDown={(e) => startCreate(e, date)} onPointerMove={moveDrag} onPointerUp={endDrag}>
                      {layoutColumns(timed).map(({ event, start, end, s, f, col, cols }) => (
                        <div
                          key={event.id}
                          role="gridcell"
                          tabIndex={0}
                          data-event={event.id}
                          data-slot="cal-event"
                          data-dragging={drag?.id === event.id || undefined}
                          data-short={f - s < 45 || undefined}
                          aria-label={`${event.title}, ${hm(start)} to ${hm(end)}${event.location ? `, ${event.location}` : ""}`}
                          style={{ top: (s / 60) * HOUR, height: Math.max(20, ((f - s) / 60) * HOUR - 2), left: `calc(${(col / cols) * 100}% + 2px)`, width: `calc(${100 / cols}% - 4px)`, ["--tone" as string]: `var(--chart-${tone(event)})` }}
                          onPointerDown={(e) => startDrag(e, event, "move")}
                          onPointerMove={moveDrag}
                          onPointerUp={endDrag}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") openEditor(draftFor(event), e.currentTarget);
                            else keys(e, event);
                          }}
                        >
                          <b>{event.title}</b>
                          <span>{hm(start)}–{hm(end)}{event.location ? ` · ${event.location}` : ""}</span>
                          <i data-slot="cal-grip" aria-hidden="true" onPointerDown={(e) => startDrag(e, event, "size")} onPointerMove={moveDrag} onPointerUp={endDrag} />
                        </div>
                      ))}
                      {drag?.mode === "create" && dayKey(drag.start) === key && drag.moved && (
                        <div data-slot="cal-event" data-ghost="" aria-hidden="true" style={{ top: (minutesOf(drag.start) / 60) * HOUR, height: ((drag.end.getTime() - drag.start.getTime()) / 3_600_000) * HOUR, left: 2, right: 2, ["--tone" as string]: "var(--brand)" }}>
                          <span>{hm(drag.start)}–{hm(drag.end)}</span>
                        </div>
                      )}
                      {clock && dayKey(clock) === key && nowLine}
                    </div>
                  );
                })}
              </div>
              <p id={`${id}-help`} className="sr-only">Each event can be moved with Alt and the arrow keys, and made longer or shorter with Alt, Shift and Up or Down. Enter opens it.</p>
            </div>
          )}

          {view === "month" && <MonthGrid anchor={anchorDate} today={today} weekStart={weekStart} events={visible} tone={tone} onOpenDay={(iso) => { setAnchor(iso); setView("day"); }} onOpen={(event, from) => openEditor(draftFor(event), from)} onCreate={(date, from) => { const start = addMinutes(date, 9 * 60); openEditor(newDraft(start, addMinutes(start, 60)), from); }} />}

          {view === "agenda" && <Agenda from={anchorDate} events={visible} calendars={calendars} onOpen={(event, from) => openEditor(draftFor(event), from)} />}
        </div>
      </div>

      <p className="sr-only" role="status">{announce}</p>

      <EventEditor
        draft={draft}
        calendars={calendars}
        onClose={() => {
          setDraft(null);
          requestAnimationFrame(() => opener.current?.isConnected && opener.current.focus());
        }}
        onSave={(next) => {
          const eventId = next.id ?? newEventId();
          const start = next.allDay ? `${next.date}T00:00` : `${next.date}T${next.start}`;
          const end = next.allDay ? `${next.date}T23:59` : `${next.date}T${next.end}`;
          save({ id: eventId, title: next.title.trim() || "Untitled event", start, end, calendar: next.calendar, allDay: next.allDay, location: next.location.trim() || undefined, notes: next.notes.trim() || undefined });
          setAnnounce(`${next.id ? "Saved" : "Added"} ${next.title.trim() || "Untitled event"}, ${longDay(parseLocal(start))}.`);
          setDraft(null);
        }}
        onDelete={(eventId) => {
          const removed = events.find((event) => event.id === eventId);
          onEventsChange(events.filter((event) => event.id !== eventId));
          setAnnounce(`Deleted ${removed?.title}.`);
          setDraft(null);
        }}
      />
    </div>
  );
}

function Sources({ calendars, hidden, setHidden }: { calendars: readonly CalendarSource[]; hidden: string[]; setHidden: (next: string[]) => void }) {
  return (
    <fieldset data-slot="cal-sources">
      <legend>Calendars</legend>
      {calendars.map((source) => (
        <label key={source.id} style={{ ["--tone" as string]: `var(--chart-${source.tone})` }}>
          <Checkbox checked={!hidden.includes(source.id)} onChange={(event) => setHidden(event.target.checked ? hidden.filter((item) => item !== source.id) : [...hidden, source.id])} />
          <span data-slot="cal-swatch" aria-hidden="true" />
          {source.label}
        </label>
      ))}
    </fieldset>
  );
}

function MonthGrid({
  anchor,
  today,
  weekStart,
  events,
  tone,
  onOpenDay,
  onOpen,
  onCreate,
}: {
  anchor: Date;
  today: string;
  weekStart: 0 | 1;
  events: readonly CalendarAppEvent[];
  tone: (event: CalendarAppEvent) => number;
  onOpenDay: (iso: string) => void;
  onOpen: (event: CalendarAppEvent, from: HTMLElement) => void;
  onCreate: (date: Date, from: HTMLElement) => void;
}) {
  const first = startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1), weekStart);
  const cells = Array.from({ length: 42 }, (_, n) => plusDays(first, n));
  const weekdays = cells.slice(0, 7).map((date) => date.toLocaleDateString("en-GB", { weekday: "short" }));
  return (
    <div data-slot="cal-month" role="grid" aria-label={anchor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}>
      <div role="row" data-slot="cal-month-head">
        {weekdays.map((day) => <span key={day} role="columnheader">{day}</span>)}
      </div>
      {Array.from({ length: 6 }, (_, week) => (
        <div role="row" key={week} data-slot="cal-month-row">
          {cells.slice(week * 7, week * 7 + 7).map((date) => {
            const key = dayKey(date);
            const list = events.filter((event) => event.start.startsWith(key)).sort((a, b) => Number(!a.allDay) - Number(!b.allDay) || a.start.localeCompare(b.start));
            return (
              <div key={key} role="gridcell" data-outside={date.getMonth() !== anchor.getMonth() || undefined} data-today={key === today || undefined} onDoubleClick={(e) => onCreate(date, e.currentTarget)}>
                <button type="button" data-slot="cal-month-day" onClick={() => onOpenDay(key)} aria-label={`${longDay(date)}, ${list.length} ${list.length === 1 ? "event" : "events"}`}>{date.getDate()}</button>
                {list.slice(0, 3).map((event) => (
                  <button key={event.id} type="button" data-event={event.id} data-slot="cal-chip" data-timed={!event.allDay || undefined} style={{ ["--tone" as string]: `var(--chart-${tone(event)})` }} onClick={(e) => onOpen(event, e.currentTarget)}>
                    {!event.allDay && <span className="tabular-nums">{event.start.slice(11, 16)}</span>} {event.title}
                  </button>
                ))}
                {list.length > 3 && <button type="button" data-slot="cal-more" onClick={() => onOpenDay(key)}>{list.length - 3} more</button>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Agenda({ from, events, calendars, onOpen }: { from: Date; events: readonly CalendarAppEvent[]; calendars: readonly CalendarSource[]; onOpen: (event: CalendarAppEvent, from: HTMLElement) => void }) {
  const start = new Date(from.getFullYear(), from.getMonth(), 1);
  const days = Array.from({ length: new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate() }, (_, n) => plusDays(start, n));
  const withEvents = days.map((date) => ({ date, list: events.filter((event) => event.start.startsWith(dayKey(date))).sort((a, b) => a.start.localeCompare(b.start)) })).filter((day) => day.list.length);
  if (!withEvents.length) return <p className="rounded-control px-4 py-10 text-center text-sm text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]">Nothing planned this month.</p>;
  return (
    <ol data-slot="cal-agenda">
      {withEvents.map(({ date, list }) => (
        <li key={dayKey(date)}>
          <h3>{longDay(date)}</h3>
          <ul>
            {list.map((event) => (
              <li key={event.id}>
                <button type="button" data-event={event.id} onClick={(e) => onOpen(event, e.currentTarget)} style={{ ["--tone" as string]: `var(--chart-${calendars.find((source) => source.id === event.calendar)?.tone ?? 1})` }}>
                  <span className="tabular-nums text-xs text-muted-foreground">{event.allDay ? "All day" : `${event.start.slice(11, 16)}–${event.end.slice(11, 16)}`}</span>
                  <span data-slot="cal-swatch" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{event.title}</span>
                  {event.location && <span className="hidden items-center gap-1 text-xs text-muted-foreground @[560px]:inline-flex"><MapPin aria-hidden="true" className="size-3.5" />{event.location}</span>}
                </button>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function EventEditor({ draft, calendars, onClose, onSave, onDelete }: { draft: Draft | null; calendars: readonly CalendarSource[]; onClose: () => void; onSave: (draft: Draft) => void; onDelete: (id: string) => void }) {
  const [form, setForm] = useState<Draft | null>(draft);
  const [error, setError] = useState<string>();
  const [shown, setShown] = useState(draft);
  const formId = useId();
  // A new draft replaces the form while rendering, so it never flashes the old one.
  if (draft !== shown) {
    setShown(draft);
    setForm(draft);
    setError(undefined);
  }
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setForm((current) => (current ? { ...current, [key]: value } : current));
  return (
    <Dialog open={!!draft} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {form && (
          <>
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit event" : "New event"}</DialogTitle>
              <DialogDescription>{longDay(parseLocal(form.date))}{form.allDay ? ", all day" : `, ${form.start}–${form.end}`}</DialogDescription>
            </DialogHeader>
            <form
              id={formId}
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!form.allDay && form.end <= form.start) return setError("The end has to be after the start.");
                onSave(form);
              }}
            >
              <Field label="Title">
                {(props) => <Input {...props} autoFocus value={form.title} placeholder="Untitled event" onChange={(e) => set("title", e.target.value)} />}
              </Field>
              <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 max-sm:grid-cols-2">
                <Field label="Date" className="max-sm:col-span-2">
                  {(props) => <Input {...props} type="date" value={form.date} onChange={(e) => e.target.value && set("date", e.target.value)} />}
                </Field>
                <Field label="Starts">
                  {(props) => <Input {...props} type="time" step={900} disabled={form.allDay} value={form.start} onChange={(e) => set("start", e.target.value)} />}
                </Field>
                <Field label="Ends" error={error}>
                  {(props) => <Input {...props} type="time" step={900} disabled={form.allDay} value={form.end} onChange={(e) => { set("end", e.target.value); setError(undefined); }} />}
                </Field>
              </div>
              <label className="flex items-center gap-2 text-[13px]">
                <Switch checked={form.allDay} onChange={(e) => set("allDay", e.target.checked)} />
                All day
              </label>
              <div className="grid gap-1.5">
                <span id={`${formId}-cal`} className="text-sm font-medium">Calendar</span>
                <SelectMenu aria-labelledby={`${formId}-cal`} value={form.calendar} onValueChange={(value) => set("calendar", value)} options={calendars.map((source) => ({ value: source.id, label: source.label, icon: <span data-slot="cal-swatch" style={{ ["--tone" as string]: `var(--chart-${source.tone})` }} /> }))} />
              </div>
              <Field label="Location" optional>
                {(props) => <Input {...props} value={form.location} onChange={(e) => set("location", e.target.value)} />}
              </Field>
              <Field label="Notes" optional>
                {(props) => <Textarea {...props} value={form.notes} onChange={(e) => set("notes", e.target.value)} />}
              </Field>
            </form>
            <DialogFooter className="sm:justify-between">
              {form.id ? <Button variant="ghost" className="text-destructive" onClick={() => onDelete(form.id!)}>Delete</Button> : <span />}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" form={formId}>{form.id ? "Save" : "Add event"}</Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
