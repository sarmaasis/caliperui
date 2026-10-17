import type { ComponentProps, ReactNode } from "react";
import { cn } from "./lib/cn";

export type EmptyStateProps = Omit<ComponentProps<"div">, "title"> & {
  title: string;
  description?: string;
  icon?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  children,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex min-w-0 flex-col items-center px-6 py-8 text-center [overflow-wrap:anywhere]",
        className,
      )}
      {...props}
    >
      {icon != null && (
        <span
          aria-hidden="true"
          className="mb-3 text-muted-foreground [&_svg]:size-5"
        >
          {icon}
        </span>
      )}
      <p className="text-sm font-semibold">{title}</p>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      )}
      {children != null && (
        <div className="mt-4 flex max-w-full flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
