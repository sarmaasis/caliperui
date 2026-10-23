import type { ReactNode } from "react";
import { cn } from "./lib/cn";
import "./site-footer.css";

export type FooterColumn = { title: string; links: readonly { label: string; href: string }[] };
export type FooterSocial = { label: string; href: string; icon: ReactNode };

/** The bottom of a marketing site: who you are, where things are, and the small print. */
export function SiteFooter({
  brand,
  description,
  columns,
  social,
  legal,
  end,
  className,
}: {
  brand: ReactNode;
  description?: string;
  columns: readonly FooterColumn[];
  social?: readonly FooterSocial[];
  /** Copyright and policy links. */
  legal?: ReactNode;
  /** Something at the end of the bottom row, such as a theme switch or a language select. */
  end?: ReactNode;
  className?: string;
}) {
  return (
    <footer data-slot="site-footer" className={cn("border-t border-border", className)}>
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-3">
          {brand}
          {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
          {social && social.length > 0 && (
            <ul aria-label="Social links" className="mt-1 flex list-none flex-wrap gap-1 p-0">
              {social.map((item) => (
                <li key={item.label}>
                  <a href={item.href} aria-label={item.label} data-slot="footer-social">
                    {item.icon}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title} className="grid content-start gap-3">
              <h2 className="text-xs font-medium text-foreground">{column.title}</h2>
              <ul className="m-0 grid list-none gap-2 p-0">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <a href={link.href} data-slot="footer-link">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      {(legal || end) && (
        <div className="border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-muted-foreground sm:px-6">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">{legal}</div>
            {end}
          </div>
        </div>
      )}
    </footer>
  );
}
