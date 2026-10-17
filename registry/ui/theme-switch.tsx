"use client";

import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import type { MouseEvent } from "react";
import { Button } from "./button";
import { cn } from "./lib/cn";
import "./theme-switch.css";

export type ThemeName = "light" | "dark";
/** How the page changes: `instant` swaps at once (product UI); the others reveal the new theme. */
export type ThemeReveal = "instant" | "circle" | "seam" | "wipe";

const revealLabel: Record<ThemeReveal, string | null> = {
  instant: null,
  circle: "Circle",
  seam: "Seam",
  wipe: "Wipe",
};

function farthestRadius(x: number, y: number) {
  return Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
}

export function ThemeSwitch({
  theme,
  variant = "circle",
  onThemeChange,
  className,
}: {
  theme: ThemeName;
  variant?: ThemeReveal;
  onThemeChange: (next: ThemeName) => void;
  className?: string;
}) {
  const next: ThemeName = theme === "dark" ? "light" : "dark";

  function change(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const root = document.documentElement;
    root.style.setProperty("--theme-origin-x", `${x}px`);
    root.style.setProperty("--theme-origin-y", `${y}px`);
    root.style.setProperty("--theme-radius", `${farthestRadius(x, y)}px`);

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = (document as Document & { startViewTransition?: (update: () => void) => { finished: Promise<void> } }).startViewTransition;
    if (variant === "instant" || reduce || !start) {
      onThemeChange(next);
      return;
    }

    root.dataset.themeReveal = variant;
    try {
      const transition = start.call(document, () => {
        flushSync(() => onThemeChange(next));
      });
      transition.finished.finally(() => {
        delete root.dataset.themeReveal;
      });
    } catch {
      delete root.dataset.themeReveal;
      onThemeChange(next);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-pressed={theme === "dark"}
      aria-label={revealLabel[variant] ? `${revealLabel[variant]}, switch to ${next} appearance` : `Switch to ${next} appearance`}
      className={cn(className)}
      onClick={change}
    >
      <span className="relative grid size-4 place-items-center">
        <Sun data-slot="theme-icon" data-visible={theme === "light"} className="col-start-1 row-start-1" />
        <Moon data-slot="theme-icon" data-visible={theme === "dark"} className="col-start-1 row-start-1" />
      </span>
    </Button>
  );
}
