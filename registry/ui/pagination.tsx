"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "./button";
import { cn } from "./lib/cn";

export type PaginationProps = Omit<
  ComponentProps<"nav">,
  "children" | "aria-label"
> & {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label?: string;
};

export function Pagination({
  page,
  pageCount,
  onPageChange,
  label = "Pagination",
  className,
  ...props
}: PaginationProps) {
  const count = Number.isFinite(pageCount)
    ? Math.max(0, Math.floor(pageCount))
    : 0;
  const current =
    count > 0 ? Math.min(count, Math.max(1, Math.floor(page) || 1)) : 0;
  return (
    <nav
      data-slot="pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className,
      )}
      {...props}
      aria-label={label}
    >
      <Button
        variant="secondary"
        aria-disabled={current <= 1}
        onClick={() => onPageChange(current - 1)}
      >
        <ChevronLeft aria-hidden="true" /> Previous
      </Button>
      <span
        role="status"
        aria-atomic="true"
        aria-current={count > 0 ? "page" : undefined}
        className="text-xs text-muted-foreground tabular-nums"
      >
        {count > 0 ? `Page ${current} of ${count}` : "No pages"}
      </span>
      <Button
        variant="secondary"
        aria-disabled={current === 0 || current >= count}
        onClick={() => onPageChange(current + 1)}
      >
        Next <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
