"use client";

import { useSyncExternalStore, type ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./kbd.css";

export type KbdPlatform = "mac" | "other";

/* Each key: the glyph people see on that platform, and the word a screen reader says. */
const named: Record<string, { mac: string; other: string; spoken: string; aria: string }> = {
  mod: { mac: "⌘", other: "Ctrl", spoken: "Command", aria: "Meta" },
  cmd: { mac: "⌘", other: "⌘", spoken: "Command", aria: "Meta" },
  meta: { mac: "⌘", other: "Win", spoken: "Command", aria: "Meta" },
  ctrl: { mac: "⌃", other: "Ctrl", spoken: "Control", aria: "Control" },
  alt: { mac: "⌥", other: "Alt", spoken: "Option", aria: "Alt" },
  option: { mac: "⌥", other: "Alt", spoken: "Option", aria: "Alt" },
  shift: { mac: "⇧", other: "Shift", spoken: "Shift", aria: "Shift" },
  enter: { mac: "↵", other: "Enter", spoken: "Enter", aria: "Enter" },
  return: { mac: "↵", other: "Enter", spoken: "Return", aria: "Enter" },
  esc: { mac: "Esc", other: "Esc", spoken: "Escape", aria: "Escape" },
  escape: { mac: "Esc", other: "Esc", spoken: "Escape", aria: "Escape" },
  tab: { mac: "⇥", other: "Tab", spoken: "Tab", aria: "Tab" },
  backspace: { mac: "⌫", other: "Backspace", spoken: "Backspace", aria: "Backspace" },
  delete: { mac: "⌦", other: "Del", spoken: "Delete", aria: "Delete" },
  space: { mac: "Space", other: "Space", spoken: "Space", aria: "Space" },
  up: { mac: "↑", other: "↑", spoken: "Up arrow", aria: "ArrowUp" },
  down: { mac: "↓", other: "↓", spoken: "Down arrow", aria: "ArrowDown" },
  left: { mac: "←", other: "←", spoken: "Left arrow", aria: "ArrowLeft" },
  right: { mac: "→", other: "→", spoken: "Right arrow", aria: "ArrowRight" },
  pageup: { mac: "PgUp", other: "PgUp", spoken: "Page up", aria: "PageUp" },
  pagedown: { mac: "PgDn", other: "PgDn", spoken: "Page down", aria: "PageDown" },
  home: { mac: "Home", other: "Home", spoken: "Home", aria: "Home" },
  end: { mac: "End", other: "End", spoken: "End", aria: "End" },
};

/** "mod+shift+k" or ["mod", "K"] → ["mod", "shift", "k"]. A lone "+" stays a key. */
function tokens(keys: string | readonly string[]) {
  if (typeof keys !== "string") return [...keys];
  if (keys === "+") return ["+"];
  return keys.split(/\+(?!$)/u).map((key) => key.trim()).filter(Boolean);
}

function describe(key: string, platform: KbdPlatform) {
  const known = named[key.toLowerCase()];
  if (known) return { glyph: known[platform], spoken: known.spoken, aria: known.aria };
  const glyph = key.length === 1 ? key.toUpperCase() : key;
  return { glyph, spoken: glyph, aria: glyph };
}

function detect(): KbdPlatform {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const name = nav.userAgentData?.platform ?? nav.platform ?? "";
  return /mac|iphone|ipad|ipod/iu.test(name) ? "mac" : "other";
}

/** The platform's modifier names. The server renders "other"; Macs switch to ⌘ after hydration. */
export function useKbdPlatform(platform?: KbdPlatform): KbdPlatform {
  const detected = useSyncExternalStore(
    () => () => {},
    detect,
    () => "other" as const,
  );
  return platform ?? detected;
}

/** The value for `aria-keyshortcuts` on the control the keys trigger, e.g. "Meta+K". */
export function toAriaKeyshortcuts(keys: string | readonly string[], platform: KbdPlatform = "other") {
  return tokens(keys)
    .map((key) => {
      if (key.toLowerCase() === "mod") return platform === "mac" ? "Meta" : "Control";
      return describe(key, platform).aria;
    })
    .join("+");
}

export type KbdProps = Omit<ComponentProps<"kbd">, "children"> & {
  /** One key or a combination: "mod+k", "shift+enter", ["alt", "↑"]. `mod` is ⌘ on a Mac and Ctrl elsewhere. */
  keys?: string | readonly string[];
  /** Free text instead of keys, e.g. "G then D". */
  children?: string;
  /** `inline` sits quietly inside a button, menu row or tooltip and takes its colour. */
  variant?: "default" | "inline";
  size?: "sm" | "md";
  /** Force a platform instead of detecting it, e.g. in documentation. */
  platform?: KbdPlatform;
};

/**
 * Keys drawn as small raised caps. A combination is one `kbd` holding a cap
 * per key, so it reads as a single shortcut; symbols such as ⌘ carry their
 * spoken name for screen readers.
 */
export function Kbd({ keys, children, variant = "default", size = "md", platform, className, ...props }: KbdProps) {
  const resolved = useKbdPlatform(platform);
  const list = keys !== undefined ? tokens(keys) : children !== undefined ? [children] : [];
  const parts = list.map((key) => describe(key, resolved));
  const shared = { "data-variant": variant, "data-size": size } as const;
  if (parts.length === 1) {
    return (
      <kbd data-slot="kbd" {...shared} className={className} {...props}>
        <Glyph {...parts[0]!} />
      </kbd>
    );
  }
  return (
    <kbd data-slot="kbd-group" {...shared} className={cn(className)} {...props}>
      {parts.map((part, index) => (
        <kbd key={index} data-slot="kbd" {...shared}>
          {index > 0 && <span className="sr-only"> </span>}
          <Glyph {...part} />
        </kbd>
      ))}
    </kbd>
  );
}

function Glyph({ glyph, spoken }: { glyph: string; spoken: string }) {
  if (glyph === spoken) return glyph;
  return (
    <>
      <span aria-hidden="true">{glyph}</span>
      <span className="sr-only">{spoken}</span>
    </>
  );
}
