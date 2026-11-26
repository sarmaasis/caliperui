"use client";
import { useState, type ComponentProps, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { cn } from "./lib/cn";
import "./pin-drop.css";

export type PinPoint = { x: number; y: number };

export type PinDropProps = Omit<ComponentProps<"div">, "onChange"> & {
  /** The pin as percentages of the area, or null for none. */
  pin?: PinPoint | null;
  defaultPin?: PinPoint | null;
  onPinChange?: (pin: PinPoint) => void;
  /** The surface the pin is dropped on: a map, a floor plan, a photo. */
  children?: ReactNode;
  /** Names the area for assistive technology, e.g. "Map". */
  label?: string;
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

/**
 * A pin you drop on a surface. Click, tap or press Enter and the pin falls from above onto the spot, squashes on
 * landing and sends out one ring. Arrow keys nudge a placed pin; Enter without a pointer drops it at the centre.
 * The surface is one button, and each drop is announced with where it landed. Under reduced motion the pin
 * appears in place with no fall.
 */
export function PinDrop({ pin, defaultPin = null, onPinChange, children, label = "Map", className, ...props }: PinDropProps) {
  const [inner, setInner] = useState<PinPoint | null>(defaultPin);
  const [drops, setDrops] = useState(0);
  const at = pin === undefined ? inner : pin;

  const place = (next: PinPoint, drop: boolean) => {
    if (pin === undefined) setInner(next);
    if (drop) setDrops((count) => count + 1);
    onPinChange?.(next);
  };
  const click = (event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (event.detail === 0) return place(at ?? { x: 50, y: 50 }, true);
    place({ x: clamp(((event.clientX - box.left) / box.width) * 100), y: clamp(((event.clientY - box.top) / box.height) * 100) }, true);
  };
  const key = (event: KeyboardEvent<HTMLButtonElement>) => {
    const move = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] }[event.key];
    if (!move || !at) return;
    event.preventDefault();
    place({ x: clamp(at.x + move[0]), y: clamp(at.y + move[1]) }, false);
  };

  return (
    <div data-slot="pin-drop" className={cn("relative overflow-hidden", className)} {...props}>
      {children}
      <button type="button" data-slot="pdr-surface" aria-label={`${label}. Drop a pin${at ? "; arrow keys move it" : ""}.`} onClick={click} onKeyDown={key} />
      {at ? (
        <span key={drops} data-slot="pdr-pin" data-dropped={drops ? "" : undefined} aria-hidden="true" style={{ left: `${at.x}%`, top: `${at.y}%` }}>
          <i data-slot="pdr-ring" />
          <svg data-slot="pdr-head" viewBox="0 0 24 32">
            <path d="M12 31C12 31 2 19.5 2 12a10 10 0 0 1 20 0c0 7.500-10 19-10 19z" />
            <circle cx="12" cy="12" r="3.500" />
          </svg>
        </span>
      ) : null}
      <span className="sr-only" role="status">
        {at ? `Pin at ${Math.round(at.x)} percent across, ${Math.round(at.y)} percent down` : ""}
      </span>
    </div>
  );
}
