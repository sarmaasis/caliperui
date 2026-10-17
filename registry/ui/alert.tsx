"use client";

import { X } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { Button } from "./button";
import { FeedbackIcon, type FeedbackVariant } from "./feedback";
import { cn } from "./lib/cn";
import "./shared/alert.css";
import "./alert.css";

export type AlertProps = Omit<ComponentProps<"div">, "title"> & {
  title: ReactNode;
  variant?: FeedbackVariant;
  loading?: boolean;
  action?: ReactNode;
  onDismiss?: () => void;
};

export function Alert({
  title,
  variant = "neutral",
  loading = false,
  children,
  action,
  onDismiss,
  className,
  ...props
}: AlertProps) {
  const titleId = useId();
  return (
    <div
      data-slot="alert"
      data-variant={loading ? "neutral" : variant}
      role={!loading && variant === "error" ? "alert" : "status"}
      aria-busy={loading || undefined}
      aria-atomic="true"
      aria-labelledby={titleId}
      className={cn(
        "grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-3 rounded-overlay border border-border bg-surface p-4 text-sm text-foreground [overflow-wrap:anywhere]",
        className,
      )}
      {...props}
    >
      <FeedbackIcon variant={variant} loading={loading} />
      <div data-slot="feedback-copy" className="min-w-0 pt-1">
        <div id={titleId} data-slot="feedback-title" className="font-semibold leading-5">
          <span key={loading ? "loading" : variant} data-slot="feedback-message">{title}</span>
        </div>
        {children != null && (
          <div data-slot="feedback-description" className="mt-1 text-sm leading-5 text-muted-foreground">
            <span key={loading ? "loading" : variant} data-slot="feedback-message">{children}</span>
          </div>
        )}
        {action != null && (
          <div data-slot="feedback-action" className="mt-3 flex max-w-full flex-wrap items-center gap-2">
            {action}
          </div>
        )}
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="-mt-1 -mr-1"
          aria-label="Dismiss alert"
          onClick={onDismiss}
        >
          <X aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
