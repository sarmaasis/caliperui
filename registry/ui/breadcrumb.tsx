import { Slot } from "@radix-ui/react-slot";
import { ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./breadcrumb.css";

export function Breadcrumb({
  "aria-label": label = "Breadcrumb",
  ...props
}: ComponentProps<"nav">) {
  return <nav data-slot="breadcrumb" aria-label={label} {...props} />;
}

export function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-1 text-[13px] leading-5 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn(
        "inline-flex min-w-0 items-center [overflow-wrap:anywhere]",
        className,
      )}
      {...props}
    />
  );
}

export type BreadcrumbLinkProps = ComponentProps<"a"> & { asChild?: boolean };

export function BreadcrumbLink({
  asChild = false,
  className,
  ...props
}: BreadcrumbLinkProps) {
  const Component = asChild ? Slot : "a";
  return (
    <Component
      data-slot="breadcrumb-link"
      className={cn(
        "inline-flex min-h-[var(--control-height)] min-w-[var(--control-height)] max-w-full items-center rounded-control px-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [overflow-wrap:anywhere]",
        className,
      )}
      {...props}
    />
  );
}

export function BreadcrumbPage({
  className,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      className={cn(
        "px-1 font-medium text-foreground [overflow-wrap:anywhere]",
        className,
      )}
      {...props}
      aria-current="page"
    />
  );
}

export function BreadcrumbSeparator({
  className,
  children,
  ...props
}: ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      className={cn(
        "inline-flex shrink-0 items-center text-muted-foreground [&_svg]:size-4",
        className,
      )}
      {...props}
      role="presentation"
      aria-hidden="true"
    >
      {children ?? <ChevronRight />}
    </li>
  );
}
