"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "./lib/cn";
import "./shared/action-label.css";
import "./hold-to-confirm.css";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * An irreversible action that needs a deliberate gesture. The fill soaks out
 * from where the press landed, a countdown says how long is left, and letting
 * go drains it back. Space or Enter can be held from the keyboard.
 */
export function HoldToConfirm({
  children,
  label = "Hold to confirm",
  doneLabel = "Confirmed",
  duration = 1500,
  onConfirm,
  className,
}: {
  children?: ReactNode;
  /** Accessible name and visible label while idle. */
  label?: string;
  /** Label after the hold completes. */
  doneLabel?: string;
  /** How long to hold, in milliseconds. */
  duration?: number;
  onConfirm: () => void;
  className?: string;
}) {
  const hint = useId();
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "holding" | "draining" | "done">("idle");
  const [origin, setOrigin] = useState<{ x: number; size: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const frame = useRef<number | null>(null);
  const started = useRef(0);
  const holding = useRef(false);
  const finished = useRef(false);

  useEffect(
    () => () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  function tick(now: number) {
    if (!holding.current) return;
    const next = Math.min(1, (now - started.current) / duration);
    setProgress(next);
    if (next >= 1) {
      holding.current = false;
      finished.current = true;
      setPhase("done");
      setAnnouncement(doneLabel);
      onConfirm();
      return;
    }
    frame.current = requestAnimationFrame(tick);
  }

  function begin(x: number, width: number) {
    if (finished.current || holding.current) return;
    holding.current = true;
    started.current = performance.now();
    setOrigin({ x, size: width * 2.4 });
    setPhase("holding");
    setAnnouncement("");
    frame.current = requestAnimationFrame(tick);
  }

  function release() {
    window.removeEventListener("pointerup", release);
    window.removeEventListener("pointercancel", release);
    if (!holding.current || finished.current) return;
    holding.current = false;
    if (frame.current != null) cancelAnimationFrame(frame.current);
    setPhase("draining");
    setProgress(0);
    setAnnouncement("Released early. Nothing happened.");
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A stale pointer cannot be captured; the window listener still ends the hold.
    }
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    begin(event.clientX - rect.left, rect.width);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (event.repeat) return;
    const width = event.currentTarget.offsetWidth;
    begin(width / 2, width);
  }

  const done = phase === "done";
  const remaining = Math.max(0, ((1 - progress) * duration) / 1000).toFixed(1);
  const lit = done ? 4 : Math.floor(progress * 4);

  return (
    <button
      type="button"
      data-slot="hold-to-confirm"
      data-phase={phase}
      disabled={done}
      aria-label={done ? doneLabel : label}
      aria-describedby={hint}
      onPointerDown={onPointerDown}
      onPointerUp={release}
      onPointerCancel={release}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={onKeyDown}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") release();
      }}
      onTransitionEnd={() => {
        if (phase === "draining") setPhase("idle");
      }}
      className={cn(
        "relative isolate inline-flex h-11 min-w-40 touch-none items-center justify-center gap-2 overflow-hidden rounded-touch bg-danger-fill px-[18px] text-[15px] font-medium text-danger-fill-foreground outline-none select-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      {!reduced && origin && (
        <span
          aria-hidden="true"
          data-slot="hold-fill"
          style={{
            left: origin.x,
            width: origin.size,
            height: origin.size,
            marginLeft: -origin.size / 2,
            marginTop: -origin.size / 2,
            transform: `scale(${done ? 1 : progress})`,
          }}
        />
      )}
      <span data-slot="action-labels" className="relative z-10" aria-hidden="true">
        <span data-slot="action-label" data-active={!done && phase !== "holding"}>
          {children ?? label}
        </span>
        <span data-slot="action-label" data-active={phase === "holding"}>
          Keep holding
          <span data-slot="hold-countdown">{remaining}s</span>
        </span>
        <span data-slot="action-label" data-active={done}>
          {doneLabel}
        </span>
      </span>
      {reduced && (
        <span aria-hidden="true" data-slot="hold-notches">
          {[0, 1, 2, 3].map((index) => (
            <i key={index} data-on={index < lit} />
          ))}
        </span>
      )}
      <span id={hint} className="sr-only">
        Press and hold for {(duration / 1000).toFixed(1)} seconds, or hold Space. Releasing early cancels it.
      </span>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </button>
  );
}
