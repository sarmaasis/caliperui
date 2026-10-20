"use client";

import { ArrowRight, Check } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { BlockRoot } from "./block-concept";
import { cn } from "./lib/cn";
import "./footer-block.css";

export type BlockFooterColumn = { title: string; links: readonly { label: string; href: string }[] };

/** Sizes the wordmark so the name spans the band exactly, whatever its length. */
function Wordmark({ children }: { children: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const node = ref.current;
    const text = node?.firstElementChild as HTMLElement | null;
    if (!node || !text) return;
    // Scale from the current size, so a fitted wordmark measures as fitted and stops.
    const fit = () => {
      // Layout width, not the drawn box: inside a scaled preview or a transformed parent the drawn box is smaller.
      const width = text.offsetWidth;
      const size = parseFloat(getComputedStyle(node).fontSize);
      if (!width || !size) return;
      const next = Math.floor((size * node.clientWidth) / width);
      if (Math.abs(next - size) >= 1) node.style.setProperty("--wordmark-size", `${next}px`);
    };
    fit();
    const observer = new ResizeObserver(() => requestAnimationFrame(fit));
    observer.observe(node);
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, [children]);
  return (
    <p ref={ref} data-slot="footer-wordmark" aria-hidden="true">
      <span>{children}</span>
    </p>
  );
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value.trim());

/**
 * The page's last word: what the company is, where everything lives, an
 * optional newsletter that confirms in place, the legal line, and the name
 * set as a wordmark across the full width of the band.
 */
export function FooterBlock({
  brand,
  tagline,
  columns,
  newsletter,
  legal,
  status,
  wordmark = true,
  className,
}: {
  brand: string;
  tagline?: string;
  columns: readonly BlockFooterColumn[];
  /** An email sign-up. `onSubmit` may return a promise; the field confirms when it settles. */
  newsletter?: { label: string; note?: string; onSubmit?: (email: string) => void | Promise<void> };
  /** e.g. "© 2026 Halden Ltd · Privacy · Terms". */
  legal?: ReactNode;
  /** A live system status line, e.g. { label: "All systems normal", href: "https://status…" }. */
  status?: { label: string; href: string };
  /** Set the brand as a full-width wordmark at the foot. */
  wordmark?: boolean;
  className?: string;
}) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "invalid" | "busy" | "done">("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isEmail(email)) {
      setState("invalid");
      return;
    }
    setState("busy");
    await newsletter?.onSubmit?.(email.trim());
    setState("done");
  }

  return (
    <BlockRoot as="footer" tone="sunken" className={className} innerClassName="!pb-0">
      <div data-slot="footer-block" className="grid gap-[clamp(40px,6cqi,72px)]">
        <div className="grid gap-12 @[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div className="grid content-start gap-6">
            <p data-slot="footer-brand">{brand}</p>
            {tagline && <p className="max-w-[36ch] text-[15px] leading-6 text-[var(--k-muted)]">{tagline}</p>}
            {newsletter &&
              (state === "done" ? (
                <p role="status" className="flex items-center gap-2 text-[15px]">
                  <Check aria-hidden="true" className="size-4 text-[var(--k-hi)]" />
                  Check {email.trim()} to confirm.
                </p>
              ) : (
                <form noValidate onSubmit={submit} className="grid max-w-[400px] gap-2">
                  <label htmlFor={`${id}-email`} className="text-sm font-medium">{newsletter.label}</label>
                  <div data-slot="footer-field" data-invalid={state === "invalid" || undefined}>
                    <input
                      id={`${id}-email`}
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      aria-invalid={state === "invalid" || undefined}
                      aria-describedby={`${id}-note`}
                      onChange={(event) => {
                        setEmail(event.currentTarget.value);
                        if (state === "invalid") setState("idle");
                      }}
                    />
                    <button type="submit" disabled={state === "busy"} aria-label={state === "busy" ? "Subscribing" : "Subscribe"}>
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                  <p id={`${id}-note`} role={state === "invalid" ? "alert" : undefined} className={cn("min-h-5 text-[13px]", state === "invalid" ? "text-[var(--k-danger)]" : "text-[var(--k-muted)]")}>
                    {state === "invalid" ? "Enter an email address like name@company.com." : newsletter.note}
                  </p>
                </form>
              ))}
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 @[640px]:grid-cols-[repeat(var(--cols),minmax(0,1fr))]" style={{ ["--cols" as string]: Math.min(columns.length, 4) }}>
            {columns.map((column) => (
              <div key={column.title} className="grid content-start gap-4">
                <h2 data-slot="footer-heading">{column.title}</h2>
                <ul className="grid gap-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}><a href={link.href} data-slot="footer-block-link">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-[var(--k-line-strong)] pt-6 text-[13px] text-[var(--k-muted)]">
          {legal && <div>{legal}</div>}
          {status && (
            <a href={status.href} className="inline-flex items-center gap-2 hover:text-[var(--k-ink)]">
              <i aria-hidden="true" data-slot="footer-status-dot" />
              {status.label}
            </a>
          )}
        </div>
        {wordmark && (
          <Wordmark>{brand}</Wordmark>
        )}
      </div>
    </BlockRoot>
  );
}
