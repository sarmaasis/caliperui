"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "./lib/cn";
import "./shared/hover-card.css";

let closeActive: (() => void) | null = null;

export function HoverCard({
  content,
  children,
  openDelay = 500,
  closeDelay = 140,
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  openDelay?: number;
  closeDelay?: number;
  className?: string;
}) {
  const cardId = useId();
  const trigger = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState({ top: 0, left: 0 });
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const dismissed = useRef(false);
  const timer = useRef(0);

  function place() {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    setBox({ top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 312) });
  }

  function show(immediate = false) {
    if (dismissed.current) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      closeActive?.();
      closeActive = () => setOpen(false);
      place();
      setOpen(true);
    }, immediate ? 0 : openDelay);
  }

  function hide() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), closeDelay);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <span
      ref={trigger}
      className="inline-flex"
      onPointerEnter={() => show(false)}
      onPointerLeave={() => {
        dismissed.current = false;
        hide();
      }}
      onFocusCapture={() => show(true)}
      onBlurCapture={hide}
    >
      <span aria-describedby={open ? cardId : undefined} onKeyDown={(event) => {
        if (event.key === "Enter") show(true);
        if (event.key === "Escape") {
          dismissed.current = true;
          setOpen(false);
        }
      }} onPointerDown={() => {
        if (window.matchMedia("(pointer: coarse)").matches) {
          setOpen((current) => !current);
          if (!open) place();
        }
      }}>
        {children}
      </span>
      {mounted && open ? createPortal(
        <span
          id={cardId}
          role="tooltip"
          data-slot="hover-card"
          className={cn("fixed z-50 w-[18.5rem] max-w-[calc(100vw-1.5rem)] rounded-overlay border p-3 text-sm", className)}
          style={{ top: box.top, left: Math.max(12, box.left) }}
          onPointerEnter={() => window.clearTimeout(timer.current)}
          onPointerLeave={hide}
        >
          {content}
        </span>,
        document.body,
      ) : null}
    </span>
  );
}

export function HoverCardProfile({
  name,
  role,
  bio,
  stats = [],
}: {
  name: string;
  role?: string;
  bio?: string;
  stats?: readonly { label: string; value: string | number }[];
}) {
  const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return (
    <span className="grid gap-2">
      <span className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-surface bg-muted text-xs font-medium">{initials}</span>
        <span>
          <span className="block font-medium">{name}</span>
          {role ? <span className="block text-xs text-muted-foreground">{role}</span> : null}
        </span>
      </span>
      {bio ? <span className="block text-muted-foreground">{bio}</span> : null}
      {stats.length > 0 ? (
        <span className="flex gap-4">
          {stats.map((stat) => (
            <span key={stat.label}>
              <span className="block text-xs text-muted-foreground">{stat.label}</span>
              <span className="font-medium">{stat.value}</span>
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
}
