"use client";
import { useRef, useState, type ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./bookmark-ribbon.css";

export type BookmarkRibbonProps = Omit<ComponentProps<"button">, "children" | "onChange"> & {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  /** What saving does, e.g. "Save article". The pressed state is carried by `aria-pressed`. */
  label?: string;
};

/**
 * A save toggle drawn as a ribbon bookmark. Saving unrolls the ribbon from the top and the whole mark dips and
 * settles, as if a page marker had been dropped in; unsaving rolls it back up. The button is a toggle with
 * `aria-pressed`, so name it for the action. A bookmark that starts saved does not animate on first paint.
 * Under reduced motion the ribbon fills without the dip.
 */
export function BookmarkRibbon({ pressed, defaultPressed = false, onPressedChange, label = "Save", className, onClick, ...props }: BookmarkRibbonProps) {
  const [inner, setInner] = useState(defaultPressed);
  const mark = useRef<SVGSVGElement>(null);
  const on = pressed ?? inner;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      data-slot="bookmark-ribbon"
      data-on={on ? "" : undefined}
      className={cn("inline-grid size-10 place-items-center", className)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (!on && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
          mark.current?.animate([{ translate: "0 -5px" }, { translate: "0 2px", offset: 0.45 }, { translate: "0 0" }], { duration: 420, easing: "cubic-bezier(.34,1.4,.64,1)" });
        }
        if (pressed === undefined) setInner(!on);
        onPressedChange?.(!on);
      }}
      {...props}
    >
      <svg ref={mark} data-slot="bkr-mark" viewBox="0 0 24 24" aria-hidden="true">
        <path data-slot="bkr-fill" d="M6 3.5h12v17l-6-4.2-6 4.2z" />
        <path data-slot="bkr-line" d="M6 3.5h12v17l-6-4.2-6 4.2z" />
      </svg>
    </button>
  );
}
