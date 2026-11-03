"use client";
import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { AnimatedCounter } from "./animated-counter";
import { cn } from "./lib/cn";
import "./shared/styles-5.css";
import "./ruler-slider.css";

export type RulerSliderProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** Names the value, e.g. "Weight". */
  label: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** A long, numbered tick every this many steps. */
  majorEvery?: number;
  /** Shown after the readout, such as "kg". */
  unit?: string;
  /** Pixels between ticks. */
  gap?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const decimalsOf = (step: number) => (String(step).split(".")[1] ?? "").length;

/**
 * A tape of ticks that slides under a fixed needle. Drag it and let go: it keeps moving with the speed you gave it,
 * slows, and clicks into the nearest step while the readout rolls. Arrow keys step, Page keys jump a numbered tick,
 * Home and End go to the ends. Under reduced motion the tape lands without the glide.
 */
export function RulerSlider({ label, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, majorEvery = 10, unit, gap = 10, className, style, ...props }: RulerSliderProps) {
  const [own, setOwn] = useState(() => clamp(defaultValue ?? min, min, max));
  const current = value ?? own;
  const [pos, setPos] = useState<number | null>(null); // the tape's live position while dragged or gliding, in value units
  const [detent, setDetent] = useState(0);
  const drag = useRef<{ x: number; start: number; samples: [number, number][] } | null>(null);
  const glide = useRef(0);
  const last = useRef(current);
  const decimals = decimalsOf(step);
  const snap = (raw: number) => clamp(Math.round((raw - min) / step) * step + min, min, max);

  const commit = (next: number) => {
    const snapped = Number(snap(next).toFixed(decimals));
    if (snapped === last.current) return;
    last.current = snapped;
    if (value === undefined) setOwn(snapped);
    onValueChange?.(snapped);
    setDetent((count) => count + 1);
  };

  useEffect(() => {
    last.current = current;
  }, [current]);
  useEffect(() => () => cancelAnimationFrame(glide.current), []);

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    cancelAnimationFrame(glide.current);
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = pos ?? current;
    drag.current = { x: event.clientX, start, samples: [[event.timeStamp, event.clientX]] };
    setPos(start);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active) return;
    // Rubber-band past the ends, so the limit is felt rather than hit.
    const raw = active.start - ((event.clientX - active.x) / gap) * step;
    const over = raw < min ? raw - min : raw > max ? raw - max : 0;
    const next = raw - over + over * 0.3;
    active.samples = [...active.samples.slice(-4), [event.timeStamp, event.clientX]];
    setPos(next);
    commit(next);
  };
  const up = () => {
    const active = drag.current;
    drag.current = null;
    if (!active || pos === null) return;
    const [[t0, x0], [t1, x1]] = [active.samples[0], active.samples[active.samples.length - 1]];
    let velocity = t1 > t0 ? (-(x1 - x0) / gap) * step / (t1 - t0) : 0; // value units per ms
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) velocity = 0;
    let at = clamp(pos, min, max);
    let then = -1;
    const frame = (now: number) => {
      const dt = then < 0 ? 16 : Math.min(32, now - then);
      then = now;
      at = clamp(at + velocity * dt, min, max);
      velocity *= Math.pow(0.994, dt);
      if (at === min || at === max) velocity = 0;
      commit(at);
      if (Math.abs(velocity) * gap / step > 0.02) {
        setPos(at);
        glide.current = requestAnimationFrame(frame);
      } else setPos(null); // the snapped value takes over and the tape eases onto it
    };
    glide.current = requestAnimationFrame(frame);
  };

  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const jumps: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: step * majorEvery, PageDown: -step * majorEvery };
    if (event.key in jumps) commit(current + jumps[event.key]);
    else if (event.key === "Home") commit(min);
    else if (event.key === "End") commit(max);
    else return;
    event.preventDefault();
    cancelAnimationFrame(glide.current);
    setPos(null);
  };

  const count = Math.round((max - min) / step) + 1;
  const shown = pos ?? current;
  const text = `${current.toFixed(decimals)}${unit ? ` ${unit}` : ""}`;

  return (
    <div data-slot="ruler-slider" className={cn("grid gap-3", className)} style={{ "--rs-gap": `${gap}px`, ...style } as CSSProperties} {...props}>
      <div data-slot="rs-readout" className="flex items-baseline justify-center gap-1.5">
        <AnimatedCounter value={current} decimals={decimals} className="text-3xl font-semibold tracking-tight" />
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={text}
        data-slot="rs-window"
        data-dragging={pos !== null ? "" : undefined}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
      >
        {/* The fade sits on a still layer: a mask on the moving tape would travel with it. */}
        <div data-slot="rs-fade">
          <div data-slot="rs-tape" style={{ "--rs-at": (shown - min) / step } as CSSProperties}>
            {Array.from({ length: count }, (_, i) => {
              const major = i % majorEvery === 0;
              const half = !major && majorEvery % 2 === 0 && i % (majorEvery / 2) === 0;
              return (
                <span key={i} data-slot="rs-tick" data-major={major ? "" : undefined} data-half={half ? "" : undefined} style={{ "--rs-i": i } as CSSProperties}>
                  {major && <span data-slot="rs-number">{(min + i * step).toFixed(decimals)}</span>}
                </span>
              );
            })}
          </div>
        </div>
        <span key={detent} data-slot="rs-needle" aria-hidden="true" />
      </div>
    </div>
  );
}
