"use client";

import { createContext, useContext, type ComponentProps } from "react";
import "./direction.css";

export type TextDirection = "ltr" | "rtl";

const DirectionContext = createContext<TextDirection>("ltr");

export type DirectionProps = Omit<ComponentProps<"div">, "dir"> & { dir: TextDirection };

/**
 * Sets the reading direction for everything inside it. Parts use logical properties and
 * `:dir()` rules, so spacing, borders and affixes follow on their own; mark an icon that
 * points somewhere with `data-mirror` and it flips too. The wrapper adds no box of its own.
 * Overlays render in a portal outside it, so they read the direction with `useDirection`.
 */
export function Direction({ dir, children, ...props }: DirectionProps) {
  return (
    <DirectionContext.Provider value={dir}>
      <div data-slot="direction" dir={dir} {...props}>
        {children}
      </div>
    </DirectionContext.Provider>
  );
}

/** The direction set by the nearest Direction, "ltr" outside one. */
export function useDirection(): TextDirection {
  return useContext(DirectionContext);
}
