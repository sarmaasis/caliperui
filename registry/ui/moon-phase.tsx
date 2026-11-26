"use client";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./moon-phase.css";

export type MoonPhaseProps = Omit<ComponentProps<"div">, "children"> & {
  /** A date to show the moon for. Ignored when `phase` is given. */
  date?: Date | string | number;
  /** The phase directly: 0 is new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
  phase?: number;
  /** Diameter in pixels. */
  size?: number;
  /** Writes the phase name and lit share under the moon. */
  showName?: boolean;
};

const SYNODIC = 29.530588853;
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const names = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];

/** The moon's phase for a date, from 0 (new) through 0.5 (full) back to 1. Good to about a day. */
export function moonPhase(date: Date | string | number) {
  const days = (new Date(date).getTime() - NEW_MOON) / 86_400_000;
  return (((days / SYNODIC) % 1) + 1) % 1;
}

export function phaseName(phase: number) {
  return names[Math.round((((phase % 1) + 1) % 1) * 8) % 8];
}

/** Path of the lit part of the disc: a half circle on the lit side closed by the terminator curve. */
export function litPath(phase: number, r = 44, c = 50) {
  const p = ((phase % 1) + 1) % 1;
  const rx = Math.abs(Math.cos(p * 2 * Math.PI)) * r;
  const waxing = p < 0.5;
  const crescent = p < 0.25 || p > 0.75;
  const side = waxing ? 1 : 0;
  const back = waxing === crescent ? 0 : 1;
  return `M${c} ${c - r}A${r} ${r} 0 0 ${side} ${c} ${c + r}A${rx.toFixed(2)} ${r} 0 0 ${back} ${c} ${c - r}Z`;
}

/**
 * The moon for a date, or for a phase you give it. The lit part is a half disc closed by the terminator, and
 * when the date changes the terminator sweeps to the new phase by the shortest way round. It is an image named
 * with the phase and the share lit. Under reduced motion it jumps.
 */
export function MoonPhase({ date, phase, size = 96, showName = true, className, ...props }: MoonPhaseProps) {
  const target = phase ?? moonPhase(date ?? 0);
  const [shown, setShown] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delta = ((((target - from + 0.5) % 1) + 1) % 1) - 0.5;
    let frame = 0;
    let start = 0;
    const step = (now: number) => {
      start ||= now;
      const t = reduce ? 1 : Math.min(1, (now - start) / 900);
      const eased = 1 - (1 - t) ** 3;
      current.current = from + delta * eased;
      setShown(current.current);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const lit = Math.round(((1 - Math.cos(target * 2 * Math.PI)) / 2) * 100);
  return (
    <div
      role="img"
      aria-label={`${phaseName(target)}, ${lit}% lit`}
      data-slot="moon-phase"
      className={cn("inline-grid justify-items-center gap-2", className)}
      {...props}
    >
      <svg data-slot="mnp-disc" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <circle data-slot="mnp-dark" cx="50" cy="50" r="44" />
        <path data-slot="mnp-lit" d={litPath(shown)} />
      </svg>
      {showName ? (
        <span data-slot="mnp-name" aria-hidden="true">
          {phaseName(target)} · {lit}%
        </span>
      ) : null}
    </div>
  );
}
