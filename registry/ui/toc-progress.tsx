"use client";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type MouseEvent } from "react";
import { cn } from "./lib/cn";
import { scrollParent, viewOf } from "./lib/scroll-view";
import "./toc-progress.css";

export type TocItem = { id: string; label: string; level?: 1 | 2 | 3 };

export type TocProgressProps = Omit<ComponentProps<"nav">, "children"> & {
  /** The headings, in page order; each `id` is the heading element's id. */
  items: TocItem[];
  /** Minutes the whole page takes to read; shows the time left when given. */
  minutes?: number;
  label?: string;
};

const indent = 12;
const xOf = (level = 1) => 4 + (level - 1) * indent;

/** The rail's path: straight down beside each row at its level's indent, bending between levels. */
function railPath(rows: { top: number; bottom: number; level?: number }[]) {
  return rows
    .map((row, i) => {
      const x = xOf(row.level);
      const start = i === 0 ? `M${x} ${row.top + 4}` : "";
      const next = rows[i + 1];
      if (!next) return `${start} L${x} ${row.bottom - 4}`;
      const nx = xOf(next.level);
      const turn = Math.min(10, (row.bottom - row.top) / 2);
      const mid = (row.bottom + next.top) / 2;
      return `${start} L${x} ${mid - turn} C${x} ${mid} ${nx} ${mid} ${nx} ${mid + turn}`;
    })
    .join(" ");
}

/**
 * A table of contents that reads along with you. A thin rail bends through the nested headings and fills as the page
 * scrolls; a marker rides the rail to the section you are in, which is also marked as the current link. Choosing a
 * link moves there and puts focus on the heading. With `minutes` it counts down the reading time left. Works in a
 * scrolling panel as well as the page. Under reduced motion the jump is instant.
 */
export function TocProgress({ items, minutes, label = "On this page", className, ...props }: TocProgressProps) {
  const list = useRef<HTMLOListElement>(null);
  const fill = useRef<SVGPathElement>(null);
  const marker = useRef<SVGCircleElement>(null);
  const [path, setPath] = useState({ d: "", height: 0, rows: [] as { top: number; bottom: number }[] });
  const [active, setActive] = useState(0);
  const [left, setLeft] = useState<number | null>(minutes ?? null);

  useLayoutEffect(() => {
    const ol = list.current;
    if (!ol) return;
    const measure = () => {
      const rows = [...ol.children].map((li, i) => {
        const el = li as HTMLElement;
        return { top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight, level: items[i]?.level };
      });
      setPath({ d: railPath(rows), height: ol.offsetHeight, rows });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ol);
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    const headings = items.map((item) => document.getElementById(item.id));
    const first = headings.find(Boolean);
    const line = fill.current;
    if (!first || !line || !path.d) return;
    const scroller = scrollParent(first);
    const total = line.getTotalLength();
    // The rail goes down the page, so a length is found from a height by halving.
    const lengthAt = (y: number) => {
      let lo = 0,
        hi = total;
      for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2;
        if (line.getPointAtLength(mid).y < y) lo = mid;
        else hi = mid;
      }
      return lo;
    };
    let frame = 0;
    const update = () => {
      frame = 0;
      const view = viewOf(scroller);
      const reading = view.top + view.height * 0.3;
      const tops = headings.map((heading) => (heading ? heading.getBoundingClientRect().top : Infinity));
      let index = 0;
      tops.forEach((top, i) => top <= reading && (index = i));
      const after = tops[index + 1];
      const end = scroller ? scroller.getBoundingClientRect().top + scroller.scrollHeight - scroller.scrollTop : document.documentElement.scrollHeight - scrollY;
      const sectionEnd = Number.isFinite(after) ? after : Math.max(end - view.height * 0.7, tops[index] + 1);
      const within = Math.min(1, Math.max(0, (reading - tops[index]) / (sectionEnd - tops[index])));
      const row = path.rows[index];
      const next = path.rows[index + 1];
      const y = row ? row.top + 4 + ((next ? next.top + 4 : row.bottom - 4) - row.top - 4) * (tops[0] > reading ? 0 : within) : 0;
      const length = lengthAt(y);
      line.style.strokeDasharray = `${length} ${total + 1}`;
      const point = line.getPointAtLength(length);
      if (marker.current) marker.current.style.transform = `translate(${point.x}px, ${point.y}px)`;
      setActive(index);
      const scrolled = scroller ? scroller.scrollTop / Math.max(1, scroller.scrollHeight - scroller.clientHeight) : scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
      if (minutes) setLeft(Math.ceil(minutes * (1 - Math.min(1, scrolled)) - 0.05));
    };
    const schedule = () => (frame ||= requestAnimationFrame(update));
    schedule();
    const target = scroller ?? window;
    target.addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
    };
  }, [items, path, minutes]);

  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const heading = document.getElementById(id);
    if (!heading) return;
    event.preventDefault();
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  };

  return (
    <nav aria-label={label} data-slot="toc-progress" className={cn("grid gap-3", className)} {...props}>
      <div className="flex items-baseline justify-between gap-3">
        <p data-slot="tp-title" className="text-sm font-medium">{label}</p>
        {left !== null && <p data-slot="tp-left" className="text-xs tabular-nums text-muted-foreground">{left <= 0 ? "Finished" : `${left} min left`}</p>}
      </div>
      <div data-slot="tp-body">
        <svg data-slot="tp-rail" aria-hidden="true" width={xOf(3) + 6} height={path.height}>
          <path data-slot="tp-track" d={path.d} />
          <path ref={fill} data-slot="tp-fill" d={path.d} />
          <circle ref={marker} data-slot="tp-marker" r={3.5} />
        </svg>
        <ol ref={list}>
          {items.map((item, i) => (
            <li key={item.id} style={{ paddingLeft: xOf(item.level) + 16 }}>
              <a href={`#${item.id}`} data-slot="tp-link" data-read={i < active ? "" : undefined} aria-current={i === active ? "location" : undefined} onClick={(event) => go(event, item.id)}>
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
