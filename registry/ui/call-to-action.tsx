import type { ReactNode } from "react";
import { cn } from "./lib/cn";
import "./call-to-action.css";

/** One last ask at the end of a page: a sentence, a reason, a button. */
export function CallToAction({
  title,
  description,
  actions,
  note,
  tone = "tinted",
  className,
}: {
  title: string;
  description?: string;
  actions: ReactNode;
  note?: ReactNode;
  tone?: "plain" | "tinted";
  className?: string;
}) {
  return (
    <section data-slot="cta" data-tone={tone} aria-label={title} className={cn("mx-auto w-full max-w-6xl px-4 py-12 sm:px-6", className)}>
      <div className="grid justify-items-center gap-4 rounded-overlay border border-border px-6 py-12 text-center sm:px-12">
        <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="max-w-lg text-muted-foreground">{description}</p>}
        <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </section>
  );
}
