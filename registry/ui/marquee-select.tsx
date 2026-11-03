"use client";
import { useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "./lib/cn";
import "./marquee-select.css";

export type MarqueeItem = { id: string; label: string; content?: ReactNode };

export type MarqueeSelectProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** Names the collection, e.g. "Photos". */
  label: string;
  items: MarqueeItem[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Classes for the grid of items, such as its columns. */
  gridClassName?: string;
};

type Box = { x: number; y: number; w: number; h: number };
const hit = (a: Box, b: DOMRect, origin: DOMRect) => a.x < b.right - origin.left && a.x + a.w > b.left - origin.left && a.y < b.bottom - origin.top && a.y + a.h > b.top - origin.top;

/**
 * Select many items by dragging a rubber band over them, the way a desktop does. Items inside the band lift as it
 * passes, Shift keeps what was already chosen, and a click chooses one (Shift or ⌘ adds it). A count springs up with
 * a way to clear. From the keyboard: arrows move, Space chooses, Shift with an arrow extends, ⌘A or Ctrl+A takes all,
 * Escape clears. Under reduced motion the lift and count appear without travel.
 */
export function MarqueeSelect({ label, items, value, defaultValue = [], onValueChange, gridClassName, className, ...props }: MarqueeSelectProps) {
  const [own, setOwn] = useState<string[]>(defaultValue);
  const selected = value ?? own;
  const [band, setBand] = useState<Box | null>(null);
  const [focus, setFocus] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const press = useRef<{ x: number; y: number; base: string[]; moved: boolean; id: string | null; additive: boolean } | null>(null);

  const set = (next: string[]) => {
    const ordered = items.map((item) => item.id).filter((id) => next.includes(id));
    if (value === undefined) setOwn(ordered);
    onValueChange?.(ordered);
  };
  const options = () => [...(root.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("[data-slot='ms-count']")) return;
    const box = event.currentTarget.getBoundingClientRect();
    const option = (event.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
    press.current = { x: event.clientX - box.left, y: event.clientY - box.top, base: additive ? selected : [], moved: false, id: option?.dataset.id ?? null, additive };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const active = press.current;
    if (!active) return;
    const origin = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - origin.left,
      y = event.clientY - origin.top;
    if (!active.moved && Math.hypot(x - active.x, y - active.y) < 6) return;
    active.moved = true;
    const next = { x: Math.min(x, active.x), y: Math.min(y, active.y), w: Math.abs(x - active.x), h: Math.abs(y - active.y) };
    setBand(next);
    const hits = options().filter((el) => hit(next, el.getBoundingClientRect(), origin)).map((el) => el.dataset.id!);
    set([...new Set([...active.base, ...hits])]);
  };
  const up = () => {
    const active = press.current;
    press.current = null;
    setBand(null);
    if (!active || active.moved || !active.id) {
      if (active && !active.moved && !active.id && !active.additive) set([]); // a click on empty space clears
      return;
    }
    const id = active.id;
    if (active.additive) set(selected.includes(id) ? selected.filter((other) => other !== id) : [...selected, id]);
    else set([id]);
    setFocus(items.findIndex((item) => item.id === id));
  };

  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const els = options();
    const here = els[focus]?.getBoundingClientRect();
    let next = focus;
    if (event.key === "ArrowRight") next = Math.min(items.length - 1, focus + 1);
    else if (event.key === "ArrowLeft") next = Math.max(0, focus - 1);
    else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && here) {
      // The nearest item in the next row, by position, so any grid works.
      const down = event.key === "ArrowDown";
      const row = els.map((el, i) => ({ i, box: el.getBoundingClientRect() })).filter(({ box }) => (down ? box.top > here.bottom - 2 : box.bottom < here.top + 2));
      const rowTop = down ? Math.min(...row.map(({ box }) => box.top)) : Math.max(...row.map(({ box }) => box.top));
      const best = row.filter(({ box }) => box.top === rowTop).sort((a, b) => Math.abs(a.box.left - here.left) - Math.abs(b.box.left - here.left))[0];
      if (best) next = best.i;
    } else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else if (event.key === " ") {
      const id = items[focus].id;
      set(selected.includes(id) ? selected.filter((other) => other !== id) : [...selected, id]);
    } else if (event.key.toLowerCase() === "a" && (event.metaKey || event.ctrlKey)) set(items.map((item) => item.id));
    else if (event.key === "Escape" && selected.length) set([]);
    else return;
    event.preventDefault();
    if (next !== focus) {
      setFocus(next);
      els[next]?.focus();
      if (event.shiftKey && !selected.includes(items[next].id)) set([...selected, items[next].id]);
    }
  };

  return (
    <div data-slot="marquee-select" className={cn("relative grid gap-3", className)} {...props}>
      <div
        ref={root}
        role="listbox"
        aria-label={label}
        aria-multiselectable="true"
        data-slot="ms-area"
        data-banding={band ? "" : undefined}
        className={cn("relative grid select-none", gridClassName)}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            role="option"
            data-id={item.id}
            data-slot="ms-item"
            aria-selected={selected.includes(item.id)}
            aria-label={item.label}
            tabIndex={i === focus ? 0 : -1}
            onFocus={() => setFocus(i)}
          >
            {item.content ?? item.label}
          </div>
        ))}
        {band && <span data-slot="ms-band" aria-hidden="true" style={{ left: band.x, top: band.y, width: band.w, height: band.h }} />}
      </div>
      <div data-slot="ms-status" aria-live="polite" className="flex min-h-8 items-center">
        {selected.length > 0 && (
          <span data-slot="ms-count">
            <span key={selected.length} data-slot="ms-number" className="tabular-nums">{selected.length}</span> selected
            <button type="button" data-slot="ms-clear" onClick={() => set([])}>
              Clear
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
