"use client";

import { Check } from "lucide-react";
import { type KeyboardEvent } from "react";
import { cn } from "./lib/cn";
import "./stepper.css";

export type Step = {
  id: string;
  label: string;
  description?: string;
  error?: string;
};

export function Stepper({
  steps,
  current,
  orientation = "horizontal",
  onStepSelect,
  label = "Progress",
  completeLabel = "All steps complete",
  className,
}: {
  steps: readonly Step[];
  current: number;
  orientation?: "horizontal" | "vertical";
  onStepSelect?: (index: number) => void;
  label?: string;
  completeLabel?: string;
  className?: string;
}) {
  const active = Math.min(steps.length, Math.max(0, current));
  const done = active >= steps.length;
  const step = steps[Math.min(active, steps.length - 1)];
  const announcement = !step ? "" : done ? completeLabel : `Step ${active + 1} of ${steps.length}: ${step.label}`;

  function onKeyDown(event: KeyboardEvent<HTMLOListElement>) {
    if (!onStepSelect) return;
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])")];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    const next = event.key === "ArrowRight" || event.key === "ArrowDown" ? index + 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? index - 1
      : event.key === "Home" ? 0
      : event.key === "End" ? buttons.length - 1
      : -1;
    if (next < 0) return;
    event.preventDefault();
    buttons[Math.min(buttons.length - 1, Math.max(0, next))]?.focus();
  }

  return (
    <nav aria-label={label} data-slot="stepper" data-orientation={orientation} className={className}>
      <p className="sr-only" aria-live="polite">{announcement}</p>
      <ol className={cn("flex", orientation === "vertical" ? "flex-col gap-1" : "flex-col gap-1 sm:flex-row sm:items-start sm:gap-2")} onKeyDown={onKeyDown}>
        {steps.map((step, index) => {
          const state = step.error ? "error" : index < active ? "complete" : index === active ? "current" : "upcoming";
          const selectable = Boolean(onStepSelect) && state === "complete";
          const body = (
            <>
              <span data-slot="stepper-marker" data-state={state} className="grid size-6 shrink-0 place-items-center rounded-full border border-border text-xs font-medium">
                {state === "complete" ? <Check aria-hidden="true" className="size-3.5" /> : index + 1}
              </span>
              <span data-slot="stepper-copy" className="min-w-0 text-left">
                <span className="block text-sm font-medium">{step.label}</span>
                {(step.error || step.description) && (
                  <span className={cn("mt-0.5 block text-xs leading-[18px]", step.error ? "text-destructive" : "text-muted-foreground")}>
                    {step.error ?? step.description}
                  </span>
                )}
                <span className="sr-only">{state === "complete" ? "Completed" : state === "error" ? "Error" : state === "current" ? "Current" : "Not started"}</span>
              </span>
            </>
          );
          return (
            <li key={step.id} data-state={state} className={cn("flex min-w-0 gap-2", orientation === "horizontal" ? (index < steps.length - 1 ? "flex-col sm:flex-1 sm:flex-row sm:items-start" : "flex-col sm:flex-row sm:items-start") : "flex-col")}>
              {selectable ? (
                <button type="button" className="flex min-w-0 gap-2 rounded-control text-left outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" onClick={() => onStepSelect?.(index)}>
                  {body}
                </button>
              ) : (
                <div className="flex min-w-0 gap-2" aria-current={state === "current" ? "step" : undefined} aria-disabled={state === "upcoming" || undefined}>
                  {body}
                </div>
              )}
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  data-slot="stepper-line"
                  data-filled={index < active || undefined}
                  className={cn(
                    "rounded-full bg-border transition-colors duration-[var(--duration-normal)] ease-out data-[filled]:bg-accent motion-reduce:transition-none",
                    orientation === "horizontal" ? "ml-3 min-h-4 w-px sm:mt-3 sm:ml-0 sm:h-px sm:min-h-0 sm:w-auto sm:min-w-6 sm:flex-1" : "ml-3 min-h-4 w-px",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
      {done && <p className="mt-2 text-sm text-muted-foreground">{completeLabel}</p>}
    </nav>
  );
}
