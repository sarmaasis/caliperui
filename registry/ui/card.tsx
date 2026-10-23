"use client";

import { useState, type ReactNode } from "react";
import { cn } from "./lib/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog";
import "./card.css";

export function Card({
  title,
  description,
  media,
  meta,
  status,
  action,
  details,
  children,
  className,
}: {
  title: string;
  description?: string;
  media?: ReactNode;
  meta?: ReactNode;
  status?: string;
  action?: ReactNode;
  details?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <article data-slot="card" className={cn("min-w-0 overflow-hidden rounded-overlay border border-border bg-background shadow-resting", className)}>
      {media && <div data-slot="card-media" className="aspect-video overflow-hidden bg-muted">{media}</div>}
      <div className="space-y-3 p-4">
        <div>
          {details ? (
            <button type="button" className="text-left text-sm font-semibold outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" onClick={() => setOpen(true)}>
              {title}
            </button>
          ) : (
            <h3 className="text-sm font-semibold">{title}</h3>
          )}
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
        {(meta || status || action) && (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {meta && <p className="truncate text-sm font-medium">{meta}</p>}
              {status && <p role="status" className="text-xs text-muted-foreground">{status}</p>}
            </div>
            {action}
          </div>
        )}
      </div>
      {details && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
            {details}
          </DialogContent>
        </Dialog>
      )}
    </article>
  );
}
