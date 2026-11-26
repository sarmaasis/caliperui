"use client";
import type { ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./bars-morph.css";

export type BarsShape = "menu" | "close" | "plus" | "minus" | "back" | "forward";

export type BarsMorphProps = Omit<ComponentProps<"span">, "children"> & {
  /** The glyph to show. Change it and the three bars move into the new shape. */
  shape: BarsShape;
};

/**
 * One icon made of three bars that turn into one another: a menu becomes a cross, a plus becomes a minus, an
 * arrow points the other way. Because the same three bars are always on screen, a toggle reads as one thing
 * changing state instead of one icon being swapped for another. Place it inside a button and name the button;
 * the glyph itself is hidden from assistive technology. The bars take the text colour. Under reduced motion the
 * shape changes without travelling.
 */
export function BarsMorph({ shape, className, ...props }: BarsMorphProps) {
  return (
    <span data-slot="bars-morph" data-shape={shape} aria-hidden="true" className={cn("relative inline-block size-5 shrink-0", className)} {...props}>
      <i />
      <i />
      <i />
    </span>
  );
}
