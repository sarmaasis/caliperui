import { Fragment, type ReactNode } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./breadcrumb";
import { cn } from "./lib/cn";

export type PageCrumb = { label: string; href?: string };

/** The top of an app page: where you are, what this page is, and what you can do here. */
export function PageHeader({
  title,
  description,
  breadcrumb,
  meta,
  actions,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  /** Ancestors then the current page; the last item is the page itself. */
  breadcrumb?: readonly PageCrumb[];
  /** Status badges or small facts beside the title. */
  meta?: ReactNode;
  /** Buttons aligned to the end; they wrap under the title on narrow screens. */
  actions?: ReactNode;
  /** Anything that belongs to the header, such as tabs. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header data-slot="page-header" className={cn("grid min-w-0 gap-4", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumb.map((crumb, i) => (
              <Fragment key={`${crumb.label}-${i}`}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {i === breadcrumb.length - 1 || !crumb.href ? <BreadcrumbPage>{crumb.label}</BreadcrumbPage> : <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="grid min-w-0 flex-1 gap-1.5 [flex-basis:20rem]">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">{title}</h1>
            {meta}
          </div>
          {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
