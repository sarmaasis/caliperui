"use client";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Label } from "./label";
import { cn } from "./lib/cn";
import "./shared/field-message.css";
import "./shared/loading-indicator.css";
import "./field.css";

export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
};

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * A label, a control and one message line wired together for assistive
 * technology. Hint, async status and error share the same reserved line and
 * rewrite it in place, so validation never pushes the next field down.
 */
export function Field({
  label,
  description,
  error,
  status,
  statusTone = "pending",
  count,
  required,
  optional,
  action,
  className,
  children,
}: {
  label: string;
  /** Hint shown on the message line until a status or error replaces it. */
  description?: ReactNode;
  /** Replaces the hint and is announced when it appears. */
  error?: string;
  /** An async result such as “Checking availability…” or “Available”. */
  status?: string;
  statusTone?: "pending" | "success";
  /** Right-aligned counter on the message line, e.g. “6 / 40”. */
  count?: string;
  required?: boolean;
  /** Adds "(optional)" after the label. */
  optional?: boolean;
  /** Something aligned with the label, such as a "Forgot password?" link. */
  action?: ReactNode;
  className?: string;
  children: (props: FieldControlProps) => ReactNode;
}) {
  const id = useId();
  const message = `${id}-message`;
  const hasMessage = Boolean(error || status || description || count);
  const tone = error ? "error" : status ? statusTone : "hint";
  return (
    <div data-slot="field" className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>
          {label}
          {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
        </Label>
        {action}
      </div>
      {children({
        id,
        "aria-describedby": hasMessage ? message : undefined,
        "aria-invalid": error ? true : undefined,
        "aria-required": required ? true : undefined,
      })}
      <p id={message} data-slot="field-message" data-tone={tone} aria-live={error ? "assertive" : "polite"} role={error ? "alert" : undefined}>
        {tone === "error" && <CircleAlert aria-hidden="true" />}
        {tone === "success" && <CircleCheck aria-hidden="true" />}
        {tone === "pending" && <LoaderCircle data-slot="loading-indicator" aria-hidden="true" />}
        <span data-slot="field-error" className="min-w-0 flex-1">{error ?? status ?? description}</span>
        {count && <span data-slot="field-count">{count}</span>}
      </p>
    </div>
  );
}
