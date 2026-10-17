"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "./button";
import { cn } from "./lib/cn";
import "./shared/action-label.css";
import "./copy-button.css";

/** "rv_live_8Kq2mZt7XcP1vW9yL3nB4f2a" → "rv_live_8K…4f2a". */
export function shortenValue(value: string, head = 10, tail = 4) {
  return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

async function writeClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Older or locked-down browsers: fall back to a selected textarea.
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

/**
 * Copies a value and confirms what was copied, shortened in mono, on a small
 * ticket above the button. If the browser blocks the clipboard, the ticket
 * offers the value selected so it can be copied by hand.
 */
export function CopyButton({
  value,
  label,
  display,
  iconOnly = false,
  variant = "secondary",
  size = "sm",
  resetAfterMs = 1800,
  onCopy,
  className,
  children,
}: {
  /** The text written to the clipboard. */
  value: string;
  /** Accessible name, e.g. "Copy live secret key". */
  label: string;
  /** What the ticket shows; defaults to the value shortened in the middle. */
  display?: string;
  iconOnly?: boolean;
  variant?: ButtonProps["variant"];
  size?: Exclude<ButtonProps["size"], "icon">;
  resetAfterMs?: number;
  onCopy?: (ok: boolean) => void;
  className?: string;
  /** Visible label; defaults to “Copy”. */
  children?: ReactNode;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const fallback = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state !== "copied") return;
    const timer = setTimeout(() => setState("idle"), resetAfterMs);
    return () => clearTimeout(timer);
  }, [state, resetAfterMs]);

  useEffect(() => {
    if (state === "failed") fallback.current?.select();
  }, [state]);

  async function copy() {
    const ok = await writeClipboard(value);
    setState(ok ? "copied" : "failed");
    onCopy?.(ok);
  }

  const copied = state === "copied";
  const iconClass = { sm: "size-8 rounded-control max-md:size-11", md: undefined, lg: "size-11 rounded-touch" }[size];

  return (
    <span
      data-slot="copy-button"
      className={cn("relative inline-flex", className)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && state !== "idle") setState("idle");
      }}
    >
      <span data-slot="copy-ticket" data-state={state} role={state === "failed" ? "alert" : "status"} aria-live={state === "failed" ? "assertive" : "polite"}>
        {copied && (
          <span data-slot="copy-ticket-body">
            <Check aria-hidden="true" />
            Copied <span className="font-mono text-[11px] opacity-75">{display ?? shortenValue(value)}</span>
          </span>
        )}
        {state === "failed" && (
          <span data-slot="copy-ticket-body" data-tone="error">
            <span>Couldn’t copy. The browser blocked the clipboard; press ⌘C or Ctrl+C.</span>
            <input
              ref={fallback}
              readOnly
              value={value}
              aria-label={`${label}: value to copy by hand`}
              onBlur={() => setState("idle")}
              className="w-full rounded-[6px] bg-background px-2 py-1 font-mono text-xs text-foreground outline-none"
            />
          </span>
        )}
      </span>
      <Button
        variant={variant}
        size={iconOnly ? "icon" : size}
        aria-label={label}
        data-copied={copied}
        className={iconOnly ? iconClass : undefined}
        onClick={copy}
      >
        <span data-slot="copy-icon" data-copied={copied} aria-hidden="true">
          <Copy />
          <Check />
        </span>
        {!iconOnly && (
          <span data-slot="action-labels">
            <span data-slot="action-label" data-active={!copied}>{children ?? "Copy"}</span>
            <span data-slot="action-label" data-active={copied}>Copied</span>
          </span>
        )}
      </Button>
    </span>
  );
}
