"use client";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Kbd } from "./kbd";
import { cn } from "./lib/cn";
import "./key-echo.css";

export type KeyEchoProps = Omit<ComponentProps<"div">, "children"> & {
  /** Echo keys pressed anywhere on the page, or only inside the parent element. */
  scope?: "page" | "parent";
  /** How many combinations stay on screen at once. */
  max?: number;
  /** How long a combination stays, in ms. */
  linger?: number;
};

type Echo = { id: number; keys: string[]; times: number };
const names: Record<string, string> = { " ": "Space", ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", Escape: "Esc", Backspace: "⌫", Enter: "↵" };
const modifiers = ["Control", "Meta", "Alt", "Shift"];

/** The caps for one key event: modifiers first, then the key, for example ["mod", "shift", "K"]. */
export function comboOf(event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">) {
  if (modifiers.includes(event.key)) return null;
  const keys: string[] = [];
  if (event.metaKey) keys.push("meta");
  if (event.ctrlKey) keys.push("ctrl");
  if (event.altKey) keys.push("alt");
  // Shift is shown only with another modifier or a non-character key, as "A" already says shift.
  if (event.shiftKey && (keys.length || event.key.length > 1)) keys.push("shift");
  keys.push(names[event.key] ?? (event.key.length === 1 ? event.key.toUpperCase() : event.key));
  return keys;
}

/**
 * Shows the keys you press as caps that pop up, stack and fade, for screen recordings, tutorials and live demos.
 * Pressing the same combination again counts it instead of adding another. It is a visual echo only, hidden from
 * assistive technology, and ignores keys typed into password fields. Under reduced motion caps appear and leave
 * without travel.
 */
export function KeyEcho({ scope = "page", max = 3, linger = 1600, className, ...props }: KeyEchoProps) {
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const next = useRef(0);

  useEffect(() => {
    const target = scope === "page" ? document : root.current?.parentElement;
    if (!target) return;
    const down = (event: Event) => {
      const key = event as KeyboardEvent;
      if ((key.target as HTMLInputElement | null)?.type === "password") return;
      const keys = comboOf(key);
      if (!keys) return;
      setEchoes((current) => {
        const last = current[current.length - 1];
        if (last && last.keys.join("+") === keys.join("+")) return [...current.slice(0, -1), { ...last, id: next.current++, times: last.times + 1 }];
        return [...current, { id: next.current++, keys, times: 1 }].slice(-max);
      });
    };
    target.addEventListener("keydown", down);
    return () => target.removeEventListener("keydown", down);
  }, [scope, max]);

  // Each combination leaves on its own clock; a repeat restarts it.
  useEffect(() => {
    if (!echoes.length) return;
    const oldest = echoes[0];
    const timer = window.setTimeout(() => setEchoes((current) => current.filter((echo) => echo.id !== oldest.id)), linger);
    return () => window.clearTimeout(timer);
  }, [echoes, linger]);

  return (
    <div ref={root} data-slot="key-echo" aria-hidden="true" className={cn("pointer-events-none flex flex-col items-center gap-2", className)} {...props}>
      {echoes.map((echo) => (
        <span key={echo.id} data-slot="ke-combo" data-repeat={echo.times > 1 ? "" : undefined}>
          <Kbd keys={echo.keys} size="md" />
          {echo.times > 1 && <span data-slot="ke-times">×{echo.times}</span>}
        </span>
      ))}
    </div>
  );
}
