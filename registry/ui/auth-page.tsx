import type { ReactNode } from "react";
import { cn } from "./lib/cn";

/** A centered page for sign in, sign up and reset flows: a brand mark, one card, and quiet links below. */
export function AuthPage({
  brand,
  children,
  footer,
  className,
}: {
  brand?: ReactNode;
  children: ReactNode;
  /** Small links under the card, such as Terms and Privacy. */
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <main data-slot="auth-page" className={cn("grid min-h-[inherit] w-full place-items-center px-4 py-10", className)}>
      <div className="grid w-full max-w-sm gap-6">
        {brand && <div className="flex justify-center text-foreground">{brand}</div>}
        <div data-slot="auth-card" className="rounded-overlay border border-border bg-surface p-6 sm:p-8">
          {children}
        </div>
        {footer && <div className="text-center text-xs text-muted-foreground">{footer}</div>}
      </div>
    </main>
  );
}
