"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "./lib/cn";
import "./scroll-area.css";

export function ScrollArea({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const shell = root.current;
    const element = viewport.current;
    const marker = thumb.current;
    if (!shell || !element || !marker) return;
    let idle = 0;
    const place = () => {
      const overflow = element.scrollHeight > element.clientHeight + 1;
      const visible = element.clientHeight / Math.max(element.scrollHeight, 1);
      const height = Math.max(24, visible * element.clientHeight);
      const travel = Math.max(0, element.clientHeight - height);
      const top = overflow ? (element.scrollTop / (element.scrollHeight - element.clientHeight)) * travel : 0;
      marker.style.height = `${height}px`;
      marker.style.transform = `translateY(${top}px)`;
      shell.toggleAttribute("data-overflow", overflow);
      shell.toggleAttribute("data-overflow-top", overflow && element.scrollTop > 4);
      shell.toggleAttribute("data-overflow-bottom", overflow && element.scrollHeight - element.clientHeight - element.scrollTop > 4);
      if (!overflow) return;
      shell.dataset.scrolling = "true";
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        delete shell.dataset.scrolling;
      }, 700);
    };
    place();
    element.addEventListener("scroll", place, { passive: true });
    const observer = new ResizeObserver(place);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => {
      element.removeEventListener("scroll", place);
      observer.disconnect();
      window.clearTimeout(idle);
    };
  }, []);

  return (
    <div ref={root} data-slot="scroll-area" className={cn("relative h-44 max-w-sm", className)}>
      <div ref={viewport} tabIndex={0} aria-label={label} data-slot="scroll-viewport" className="h-full overflow-auto pr-3 outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        {children}
      </div>
      <span aria-hidden="true" data-slot="scroll-fade" data-edge="top" />
      <span aria-hidden="true" data-slot="scroll-fade" data-edge="bottom" />
      <span ref={thumb} aria-hidden="true" data-slot="scroll-thumb" />
    </div>
  );
}
