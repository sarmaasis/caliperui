"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { GlideHighlight, type GlideBox } from "./glide-highlight";
import { Label } from "./label";
import { cn } from "./lib/cn";
import "./otp-input.css";

export function OtpInput({
  label = "One-time code",
  length = 6,
  value,
  defaultValue = "",
  onValueChange,
  status = "idle",
  message,
  disabled,
  name,
  className,
}: {
  label?: string;
  length?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  status?: "idle" | "error" | "success";
  /** Replaces the status line, e.g. why a code was refused or “Checking the code…”. */
  message?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
}) {
  const [local, setLocal] = useState(defaultValue);
  const [active, setActive] = useState(0);
  const [box, setBox] = useState<GlideBox | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const shell = useRef<HTMLDivElement>(null);
  const current = (value ?? local).slice(0, length);
  const live = useRef(current);
  const digits = Array.from({ length }, (_, index) => current[index] ?? "");

  function commit(next: string) {
    const clipped = next.replace(/\D/g, "").slice(0, length);
    live.current = clipped;
    if (value == null) setLocal(clipped);
    onValueChange?.(clipped);
  }

  useLayoutEffect(() => {
    live.current = current;
    const root = shell.current;
    const field = inputs.current[active];
    if (!root || !field) return;
    const rootRect = root.getBoundingClientRect();
    const rect = field.getBoundingClientRect();
    setBox({
      active: true,
      left: rect.left - rootRect.left,
      top: rect.top - rootRect.top,
      width: rect.width,
      height: rect.height,
    });
  }, [active, current]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Label>{label}</Label>
      <div ref={shell} data-slot="otp" data-invalid={status === "error" || undefined} data-success={status === "success" || undefined} className="relative grid w-fit max-w-full gap-2" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 2.75rem))` }}>
        <GlideHighlight box={box} />
        {digits.map((digit, index) => (
          <span key={index} className="grid min-w-0">
          <input
            ref={(node) => {
              inputs.current[index] = node;
            }}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`${label} digit ${index + 1}`}
            disabled={disabled}
            value={digit}
            maxLength={1}
            className="z-10 col-start-1 row-start-1 h-11 w-full min-w-0 rounded-control bg-[var(--field)] shadow-[var(--shadow-field)] transition-shadow hover:shadow-[var(--shadow-field-hover)] text-center text-sm font-medium text-transparent tabular-nums caret-transparent outline-none focus-visible:shadow-[var(--shadow-field-focus)]"
            onFocus={() => setActive(index)}
            onChange={(event) => {
              const text = event.currentTarget.value.replace(/\D/g, "");
              const valueNow = live.current;
              if (text.length > 1) {
                commit(`${valueNow.slice(0, index)}${text}`);
                const next = Math.min(length - 1, index + text.length);
                inputs.current[next]?.focus();
                return;
              }
              const nextValue = `${valueNow.slice(0, index)}${text}${valueNow.slice(index + 1)}`;
              commit(nextValue);
              if (text) inputs.current[Math.min(length - 1, index + 1)]?.focus();
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !live.current[index]) {
                event.preventDefault();
                const previous = Math.max(0, index - 1);
                commit(`${live.current.slice(0, previous)}${live.current.slice(previous + 1)}`);
                inputs.current[previous]?.focus();
              } else if (event.key === "ArrowLeft") {
                inputs.current[Math.max(0, index - 1)]?.focus();
              } else if (event.key === "ArrowRight") {
                inputs.current[Math.min(length - 1, index + 1)]?.focus();
              }
            }}
            onPaste={(event) => {
              event.preventDefault();
              const text = event.clipboardData.getData("text").replace(/\D/g, "");
              commit(`${live.current.slice(0, index)}${text}`);
              inputs.current[Math.min(length - 1, index + text.length)]?.focus();
            }}
          />
          <span aria-hidden="true" data-slot="otp-digit" key={digit || "empty"} className="pointer-events-none z-20 col-start-1 row-start-1 grid place-items-center text-sm font-medium text-foreground">
            {digit}
          </span>
          </span>
        ))}
        </div>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <p role="status" className={cn("min-h-5 text-xs", status === "error" ? "text-destructive" : "text-muted-foreground")}>
        {message ?? (status === "error" ? "That code was not accepted." : status === "success" ? "Code accepted." : `${current.length} of ${length} digits.`)}
      </p>
    </div>
  );
}
