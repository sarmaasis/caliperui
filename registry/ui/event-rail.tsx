"use client";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "./lib/cn";
import "./event-rail.css";

export type RailEvent = { id: string; date: string; year: string | number; title: string; description?: string };

export type EventRailProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** Names the timeline, e.g. "Company history". */
  label: string;
  events: RailEvent[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
};

/**
 * Dated events on a rail you drag sideways. The event in the middle is full size and its neighbours shrink and dim
 * with distance, ticks run between the cards, and each new year's numeral drifts slowly behind them. It is a list
 * box: arrow keys move to the next event, Home and End to the ends, and a click centres an event. Touch scrolls
 * natively; a mouse can drag. Under reduced motion the rail jumps instead of gliding and the year stays put.
 */
export function EventRail({ label, events, value, defaultValue, onValueChange, className, ...props }: EventRailProps) {
  const [own, setOwn] = useState(defaultValue ?? events[0]?.id);
  const current = value ?? own;
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const lastSent = useRef(current);
  const dragged = useRef(false);

  const cards = () => [...(scroller.current?.querySelectorAll<HTMLElement>("[data-slot='er-card']") ?? [])];
  const centre = (id: string, smooth = true) => {
    const box = scroller.current;
    const card = cards().find((el) => el.dataset.id === id);
    if (!box || !card) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - box.clientWidth / 2, behavior: smooth && !still ? "smooth" : "auto" });
  };

  // Each card's distance from the middle drives its size, dimming and the year's drift; the nearest one is chosen.
  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const mid = box.scrollLeft + box.clientWidth / 2;
      let best: HTMLElement | null = null,
        nearest = Infinity;
      for (const card of cards()) {
        const d = (card.offsetLeft + card.offsetWidth / 2 - mid) / card.offsetWidth;
        card.style.setProperty("--er-d", d.toFixed(3));
        card.style.setProperty("--er-a", Math.min(2, Math.abs(d)).toFixed(3));
        if (Math.abs(d) < nearest) [nearest, best] = [Math.abs(d), card];
      }
      const id = best?.dataset.id;
      if (id && id !== lastSent.current && !drag.current) {
        lastSent.current = id;
        if (value === undefined) setOwn(id);
        onValueChange?.(id);
      }
    };
    const schedule = () => (frame ||= requestAnimationFrame(update));
    update();
    box.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(box);
    return () => {
      cancelAnimationFrame(frame);
      box.removeEventListener("scroll", schedule);
      observer.disconnect();
    };
  });

  // An outside change of value brings that event to the middle.
  useLayoutEffect(() => {
    if (current !== lastSent.current) {
      lastSent.current = current;
      centre(current);
    }
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => centre(current, false), []); // eslint-disable-line react-hooks/exhaustive-deps

  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = events.findIndex((item) => item.id === current);
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: events.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = events[Math.max(0, Math.min(events.length - 1, next))];
    if (value === undefined) setOwn(target.id);
    lastSent.current = target.id;
    onValueChange?.(target.id);
    centre(target.id);
  };

  const down = (event: PointerEvent<HTMLDivElement>) => {
    dragged.current = false;
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active) return;
    if (!active.moved && Math.abs(event.clientX - active.x) > 4) {
      active.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.dragging = "";
    }
    if (active.moved) event.currentTarget.scrollLeft = active.left - (event.clientX - active.x);
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    drag.current = null;
    if (!active) return;
    const box = event.currentTarget;
    if (active.moved) {
      delete box.dataset.dragging;
      const mid = box.scrollLeft + box.clientWidth / 2;
      const nearest = cards().sort((a, b) => Math.abs(a.offsetLeft + a.offsetWidth / 2 - mid) - Math.abs(b.offsetLeft + b.offsetWidth / 2 - mid))[0];
      if (nearest?.dataset.id) centre(nearest.dataset.id);
      dragged.current = true; // the click that ends a drag does not also choose
    }
  };

  return (
    <div data-slot="event-rail" className={cn("relative", className)} {...props}>
      <div
        ref={scroller}
        role="listbox"
        tabIndex={0}
        aria-label={label}
        aria-activedescendant={`er-${current}`}
        data-slot="er-scroller"
        onKeyDown={key}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClick={(event) => {
          if (dragged.current) return void (dragged.current = false);
          const card = (event.target as HTMLElement).closest<HTMLElement>("[data-slot='er-card']");
          if (card?.dataset.id) centre(card.dataset.id);
        }}
      >
        <ol data-slot="er-track">
          {events.map((item, i) => {
            const newYear = i === 0 || String(events[i - 1].year) !== String(item.year);
            return (
              <li key={item.id} id={`er-${item.id}`} role="option" aria-selected={item.id === current} data-slot="er-card" data-id={item.id} aria-label={`${item.date}: ${item.title}`}>
                {newYear && (
                  <span data-slot="er-year" aria-hidden="true">
                    {item.year}
                  </span>
                )}
                <span data-slot="er-face">
                  <span data-slot="er-date">{item.date}</span>
                  <span data-slot="er-title">{item.title}</span>
                  {item.description && <span data-slot="er-description">{item.description}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
