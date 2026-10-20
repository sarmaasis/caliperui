import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./lib/cn";
import "./shared/bulk-bar.css";
import "./shared/chip-option.css";
import "./data-table.css";

export type DataTableProps = ComponentProps<"table"> & {
  caption: string;
};

export function DataTable({
  caption,
  className,
  children,
  ...props
}: DataTableProps) {
  return (
    <div
      role="region"
      aria-label={`${caption}, scrollable table`}
      tabIndex={0}
      className="relative min-w-0 overflow-x-auto focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <table
        data-slot="data-table"
        className={cn("w-full border-collapse text-start text-sm", className)}
        {...props}
      >
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function DataTableHead({
  className,
  scope = "col",
  numeric = false,
  sort,
  onSort,
  children,
  ...props
}: ComponentProps<"th"> & {
  /** Right-aligned with tabular figures, for money and counts. */
  numeric?: boolean;
  /** Makes the header a sort button. */
  sort?: "ascending" | "descending" | "none";
  onSort?: () => void;
}) {
  const Icon = sort === "ascending" ? ArrowUp : sort === "descending" ? ArrowDown : ArrowUpDown;
  return (
    <th
      scope={scope}
      aria-sort={sort}
      className={cn(
        "border-b border-border px-3 text-start first:ps-4 last:pe-4",
        scope === "row"
          ? "py-[var(--row-padding)] align-middle text-sm font-normal"
          : "h-11 text-xs font-medium text-muted-foreground",
        numeric && "text-end tabular-nums",
        className,
      )}
      {...props}
    >
      {onSort ? (
        <button type="button" data-slot="sort-button" onClick={onSort} className={cn("inline-flex items-center gap-1 rounded-[4px] outline-none hover:text-foreground focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", numeric && "flex-row-reverse")}>
          {children}
          <Icon aria-hidden="true" className={cn("size-3.5", sort === "none" && "opacity-50")} />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function DataTableCell({
  className,
  numeric = false,
  ...props
}: ComponentProps<"td"> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        "border-b border-border px-3 py-[var(--row-padding)] align-middle first:ps-4 last:pe-4",
        numeric && "text-end tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

/** A row with a quiet hover fill, an ember-tinted selected state and a keyboard cursor. */
export function DataTableRow({
  selected,
  cursor,
  className,
  ...props
}: ComponentProps<"tr"> & { selected?: boolean; cursor?: boolean }) {
  return (
    <tr
      data-slot="data-table-row"
      aria-selected={selected}
      data-cursor={cursor || undefined}
      className={className}
      {...props}
    />
  );
}

/** Rises from the bottom while rows are selected: the count, the total and actions for all of them. */
export function DataTableBulkBar({
  count,
  summary,
  children,
  className,
}: {
  count: number;
  summary?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="toolbar" aria-label="Bulk actions" data-slot="bulk-bar" data-open={count > 0} aria-hidden={count === 0 || undefined} className={className}>
      <span className="text-sm font-medium tabular-nums" aria-live="polite">
        {count} selected{summary ? <> · {summary}</> : null}
      </span>
      {children}
    </div>
  );
}
