"use client";
import { useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "./lib/cn";
import "./shuffle-grid.css";

export type ShuffleItem = { id: string; label: string; tags: string[]; content?: ReactNode };
export type ShuffleFilter = { value: string; label: string };

export type ShuffleGridProps = Omit<ComponentProps<"div">, "children"> & {
  /** Names the collection, e.g. "Projects". */
  label: string;
  items: ShuffleItem[];
  /** The filters after "All"; an item shows when its `tags` include the chosen value. */
  filters: ShuffleFilter[];
  /** Classes for the grid, such as its columns. */
  gridClassName?: string;
  /** Names a count, e.g. ["project", "projects"]. */
  noun?: [string, string];
};

type Box = { left: number; top: number; width: number; height: number };

/**
 * A grid you filter with a row of chips. Items that stay glide to their new places, items that leave shrink away
 * from where they stood, and items that arrive grow in, so a filter reads as a rearrangement rather than a swap.
 * The chips are toggle buttons and the count is announced. Under reduced motion the grid changes at once.
 */
export function ShuffleGrid({ label, items, filters, gridClassName, noun = ["item", "items"], className, ...props }: ShuffleGridProps) {
  const [filter, setFilter] = useState("all");
  const grid = useRef<HTMLUListElement>(null);
  const boxes = useRef(new Map<string, Box>());
  const height = useRef(0);
  const shown = new Set(items.filter((item) => filter === "all" || item.tags.includes(filter)).map((item) => item.id));

  // After each change, every item is played from where it was drawn to where it now is.
  useLayoutEffect(() => {
    const el = grid.current;
    if (!el) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const origin = el.getBoundingClientRect();
    const cells = [...el.querySelectorAll<HTMLElement>("[data-slot='shg-cell']")];
    const next = new Map<string, Box>();
    for (const cell of cells) {
      if (cell.hasAttribute("data-out")) continue;
      cell.getAnimations().forEach((animation) => animation.cancel());
      cell.style.cssText = "";
      const box = cell.getBoundingClientRect();
      next.set(cell.dataset.id!, { left: box.left - origin.left, top: box.top - origin.top, width: box.width, height: box.height });
    }
    for (const cell of cells) {
      const id = cell.dataset.id!;
      const was = boxes.current.get(id);
      const now = next.get(id);
      if (still || !boxes.current.size) continue;
      if (now && was) {
        const dx = was.left - now.left,
          dy = was.top - now.top;
        if (dx || dy) cell.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }], { duration: 460, easing: "cubic-bezier(.3,.9,.25,1)" });
      } else if (now) {
        cell.animate([{ opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1 }], { duration: 360, delay: 120, easing: "cubic-bezier(.2,.8,.3,1)", fill: "backwards" });
      } else if (was) {
        // A leaving item keeps its old box for its exit, then the stylesheet hides it.
        Object.assign(cell.style, { display: "block", position: "absolute", left: `${was.left}px`, top: `${was.top}px`, width: `${was.width}px`, height: `${was.height}px` });
        cell.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.86 }], { duration: 240, easing: "ease-in", fill: "forwards" }).finished.then(() => (cell.style.cssText = ""), () => undefined);
      }
    }
    // The grid eases to its new height, so items still leaving are not left hanging below it.
    const now = el.offsetHeight;
    if (!still && height.current && height.current !== now) el.animate([{ height: `${height.current}px` }, { height: `${now}px` }], { duration: 460, easing: "cubic-bezier(.3,.9,.25,1)" });
    height.current = now;
    boxes.current = next;
  }, [filter]);

  // A resize moves items without a filter change, so their last boxes are measured again, without motion.
  useLayoutEffect(() => {
    const el = grid.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (el.getAnimations().length) return; // mid-change; the next change measures again
      height.current = el.offsetHeight;
      const origin = el.getBoundingClientRect();
      for (const cell of el.querySelectorAll<HTMLElement>("[data-slot='shg-cell']:not([data-out])")) {
        const box = cell.getBoundingClientRect();
        boxes.current.set(cell.dataset.id!, { left: box.left - origin.left, top: box.top - origin.top, width: box.width, height: box.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const count = shown.size;
  return (
    <div data-slot="shuffle-grid" className={cn("grid gap-4", className)} {...props}>
      <div role="group" aria-label={`Filter ${label.toLowerCase()}`} data-slot="shg-filters" className="flex flex-wrap gap-1.5">
        {[{ value: "all", label: "All" }, ...filters].map((option) => (
          <button key={option.value} type="button" data-slot="shg-chip" aria-pressed={filter === option.value} onClick={() => setFilter(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
      <ul ref={grid} aria-label={label} data-slot="shg-grid" className={cn("relative grid", gridClassName)}>
        {items.map((item) => (
          <li key={item.id} data-slot="shg-cell" data-id={item.id} data-out={shown.has(item.id) ? undefined : ""} aria-hidden={shown.has(item.id) ? undefined : true}>
            {item.content ?? item.label}
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {count} {count === 1 ? noun[0] : noun[1]}
      </p>
    </div>
  );
}
