"use client";
import { useState, type ReactNode } from "react";
import { Search } from "./search";
import { cn } from "./lib/cn";
import "./not-found-page.css";

/** A dead end that helps: what happened in plain words, a way home, and a few places people usually wanted. */
export function NotFoundPage({
  code = "404",
  title = "We can't find that page",
  description = "The link may be old, or the page may have moved. Here are some places to start.",
  actions,
  suggestions,
  onSearch,
  className,
}: {
  code?: string;
  title?: string;
  description?: string;
  /** Usually a primary "Go home" button and a quiet "Go back". */
  actions?: ReactNode;
  suggestions?: readonly { label: string; href: string; description?: string }[];
  /** Adds a search field; called with the query. */
  onSearch?: (query: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  return (
    <main data-slot="not-found" className={cn("mx-auto grid w-full max-w-xl justify-items-center gap-6 px-4 py-16 text-center", className)}>
      <p aria-hidden="true" data-slot="error-code">
        {code}
      </p>
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-sm text-muted-foreground">
          <span className="sr-only">Error {code}. </span>
          {description}
        </p>
      </div>
      {onSearch && (
        <form
          role="search"
          className="w-full max-w-sm"
          onSubmit={(event) => {
            event.preventDefault();
            if (query.trim()) onSearch(query.trim());
          }}
        >
          <Search aria-label="Search the site" placeholder="Search the site" value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery("")} />
        </form>
      )}
      {actions && <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div>}
      {suggestions && suggestions.length > 0 && (
        <nav aria-label="Suggested pages" className="w-full text-left">
          <ul className="divide-y divide-border rounded-overlay border border-border">
            {suggestions.map((s) => (
              <li key={s.href + s.label}>
                <a href={s.href} data-slot="suggestion">
                  <span className="text-sm font-medium">{s.label}</span>
                  {s.description && <span className="text-xs text-muted-foreground">{s.description}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}
