"use client";

import { Hourglass, RotateCw, Search as SearchIcon, WifiOff } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { BlockActions, BlockEyebrow, BlockLead, BlockRoot, BlockTitle, type BlockAction } from "./block-concept";
import type { BlockNavLink } from "./block-nav";
import { Button } from "./button";
import { CopyButton } from "./copy-button";
import { Field } from "./field";
import { Input } from "./input";
import { TemplatePage, type TemplateFooter } from "./template-page";
import { Textarea } from "./textarea";
import "./error-template.css";

export type ErrorKind = "404" | "403" | "500" | "503" | "offline" | "expired";

const copy: Record<ErrorKind, { eyebrow: string; title: string; lead: string }> = {
  "404": { eyebrow: "Page not found", title: "That page isn't here", lead: "The link may be old, or the page may have moved. Search, or start from one of these." },
  "403": { eyebrow: "No access", title: "You don't have access to this yet", lead: "This page belongs to a workspace you're not a member of. Ask its owner, or switch to the account that has access." },
  "500": { eyebrow: "Something broke", title: "This page didn't load", lead: "It's our fault, not yours. Nothing you did was lost. Try again, and if it keeps happening, send us the reference below." },
  "503": { eyebrow: "Planned maintenance", title: "We're upgrading the database", lead: "Everything you saved is safe. The site is read-only until the work finishes." },
  offline: { eyebrow: "No connection", title: "You're offline", lead: "Check your Wi-Fi or mobile data. This page will notice when you're back." },
  expired: { eyebrow: "Link expired", title: "That link has expired", lead: "For your security, links in our emails work for 30 minutes. Send yourself a new one." },
};

const online = {
  subscribe(notify: () => void) {
    window.addEventListener("online", notify);
    window.addEventListener("offline", notify);
    return () => {
      window.removeEventListener("online", notify);
      window.removeEventListener("offline", notify);
    };
  },
  get: () => navigator.onLine,
  server: () => true,
};

function useMinutesLeft(until?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [until]);
  return until ? Math.max(0, Math.ceil((Date.parse(until) - now) / 60_000)) : null;
}

const clock = (iso: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date(iso));

/**
 * The pages people land on when something goes wrong, each with the way
 * out that fits: search for a missing page, ask for access, retry with a
 * reference to quote, wait out maintenance with a time, notice when the
 * connection returns, or send a fresh link. Built only from the Free blocks.
 */
export function ErrorTemplate({
  kind,
  brand,
  nav,
  signIn,
  primary,
  title,
  lead,
  actions,
  suggestions = [],
  onSearch,
  signedInAs,
  onRequestAccess,
  reference,
  onRetry,
  statusHref,
  until,
  onResend,
  isOnline,
  footer,
  className,
}: {
  kind: ErrorKind;
  brand: string;
  nav?: readonly BlockNavLink[];
  signIn?: BlockAction;
  primary?: BlockAction;
  title?: string;
  lead?: string;
  /** Usually "Go home" and a quiet "Go back". */
  actions?: { primary?: BlockAction; secondary?: BlockAction };
  /** Places people usually wanted, for 404. */
  suggestions?: readonly { label: string; href: string; description?: string }[];
  /** 404: adds a search; called with the query. */
  onSearch?: (query: string) => void;
  /** 403: the account that was refused, e.g. "dana@forma.studio". */
  signedInAs?: string;
  /** 403: asks the owner. May return a promise; a thrown error is shown. */
  onRequestAccess?: (note: string) => void | Promise<void>;
  /** 500: an ID support can look up. */
  reference?: string;
  /** 500, 503 and offline: try the page again. */
  onRetry?: () => void | Promise<void>;
  /** 500 and 503: the public status page. */
  statusHref?: string;
  /** 503: when maintenance is expected to end, as an ISO date-time. */
  until?: string;
  /** expired: sends a new link. */
  onResend?: () => void | Promise<void>;
  /** offline: override the browser's online state, e.g. in a preview. */
  isOnline?: boolean;
  footer?: TemplateFooter;
  className?: string;
}) {
  const text = copy[kind];
  const browserOnline = useSyncExternalStore(online.subscribe, online.get, online.server);
  const connected = isOnline ?? browserOnline;
  const minutes = useMinutesLeft(kind === "503" ? until : undefined);
  const figure: ReactNode =
    kind === "offline" ? <WifiOff aria-hidden="true" /> : kind === "expired" ? <Hourglass aria-hidden="true" /> : kind;

  return (
    <TemplatePage brand={brand} nav={nav} signIn={signIn} primary={primary} footer={footer} className={className}>
      <BlockRoot width="narrow">
        <div data-slot="error-page" data-kind={kind}>
          <p data-slot="error-figure" aria-hidden="true">{figure}</p>
          <div className="grid gap-5">
            <BlockEyebrow>{text.eyebrow}</BlockEyebrow>
            <BlockTitle as="h1" size={2} className="max-w-[16ch]">
              {kind === "offline" && connected ? "You're back online" : (title ?? text.title)}
            </BlockTitle>
            <BlockLead>
              {kind === "offline" && connected ? "The connection is back. Reload to pick up where you left off." : (lead ?? text.lead)}
              <span className="sr-only">{kind === "offline" || kind === "expired" ? "" : ` Error ${kind}.`}</span>
            </BlockLead>
          </div>

          {kind === "404" && onSearch && <SearchForm onSearch={onSearch} />}
          {kind === "403" && <AccessRequest signedInAs={signedInAs} onRequestAccess={onRequestAccess} />}
          {kind === "500" && <Retry onRetry={onRetry} reference={reference} statusHref={statusHref} />}
          {kind === "503" && (
            <div data-slot="error-panel" role="status">
              {until ? (
                <p className="m-0 text-[15px]">
                  {minutes && minutes > 0 ? (
                    <>
                      Back in about <b className="font-medium">{minutes} {minutes === 1 ? "minute" : "minutes"}</b>, at {clock(until)}.
                    </>
                  ) : (
                    "The work should be finished. Try again."
                  )}
                </p>
              ) : (
                <p className="m-0 text-[15px]">We’ll be back shortly.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {onRetry && <RetryButton onRetry={onRetry} label="Check again" />}
                {statusHref && <a href={statusHref} data-slot="block-button" data-kind="secondary">Follow on the status page</a>}
              </div>
            </div>
          )}
          {kind === "offline" && (
            <div data-slot="error-panel" role="status" data-online={connected || undefined}>
              <p className="m-0 flex items-center gap-2 text-[15px]">
                <span data-slot="error-dot" aria-hidden="true" />
                {connected ? "Connected" : "Waiting for a connection…"}
              </p>
              {onRetry && <RetryButton onRetry={onRetry} label={connected ? "Reload page" : "Try anyway"} />}
            </div>
          )}
          {kind === "expired" && <Resend onResend={onResend} />}

          {(actions?.primary || actions?.secondary) && <BlockActions primary={actions.primary} secondary={actions.secondary} />}

          {suggestions.length > 0 && (
            <nav aria-label="Suggested pages" data-slot="error-suggestions">
              <ul>
                {suggestions.map((item) => (
                  <li key={item.href}>
                    <a href={item.href}>
                      <span className="text-[16px] font-medium">{item.label}</span>
                      {item.description && <span className="text-[14px] text-[var(--k-muted)]">{item.description}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </BlockRoot>
    </TemplatePage>
  );
}

function SearchForm({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");
  return (
    <form
      role="search"
      className="flex max-w-md flex-wrap gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (query.trim()) onSearch(query.trim());
      }}
    >
      <Input aria-label="Search the site" type="search" placeholder="Search the site" value={query} onChange={(event) => setQuery(event.target.value)} leading={<SearchIcon aria-hidden="true" className="size-4" />} className="w-auto min-w-0 flex-1 basis-56" />
      <Button type="submit" variant="secondary">Search</Button>
    </form>
  );
}

function RetryButton({ onRetry, label = "Try again" }: { onRetry: () => void | Promise<void>; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onRetry();
        } finally {
          setBusy(false);
        }
      }}
    >
      <RotateCw aria-hidden="true" />
      {label}
    </Button>
  );
}

function Retry({ onRetry, reference, statusHref }: { onRetry?: () => void | Promise<void>; reference?: string; statusHref?: string }) {
  const [tries, setTries] = useState(0);
  const [busy, setBusy] = useState(false);
  return (
    <div data-slot="error-panel">
      {reference && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[13px] text-[var(--k-muted)]">Reference</span>
          <code data-slot="error-reference">{reference}</code>
          <CopyButton value={reference} label="Copy reference" variant="secondary" />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {onRetry && (
          <Button
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onRetry();
              } catch {
                setTries((count) => count + 1);
              } finally {
                setBusy(false);
              }
            }}
          >
            <RotateCw aria-hidden="true" />
            Try again
          </Button>
        )}
        {statusHref && <a href={statusHref} className="text-[14px] underline underline-offset-4">Check system status</a>}
      </div>
      <p role="status" className="m-0 min-h-5 text-[13px] text-[var(--k-muted)]">
        {tries > 0 && `Still not working after ${tries} ${tries === 1 ? "try" : "tries"}. ${tries > 1 && reference ? "Send the reference to support and we'll look." : "Give it a minute."}`}
      </p>
    </div>
  );
}

function AccessRequest({ signedInAs, onRequestAccess }: { signedInAs?: string; onRequestAccess?: (note: string) => void | Promise<void> }) {
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string>();
  const done = useRef<HTMLParagraphElement>(null);
  const id = useId();
  useEffect(() => {
    if (state === "sent") done.current?.focus();
  }, [state]);
  if (!onRequestAccess) return signedInAs ? <p className="m-0 text-[15px] text-[var(--k-muted)]">Signed in as <b className="font-medium text-[var(--k-ink)]">{signedInAs}</b>.</p> : null;
  if (state === "sent")
    return (
      <div data-slot="error-panel">
        <p ref={done} tabIndex={-1} role="status" className="m-0 text-[15px] outline-none">
          Request sent. The owner will get an email, and you’ll hear back at <b className="font-medium">{signedInAs ?? "your address"}</b>.
        </p>
      </div>
    );
  return (
    <form
      data-slot="error-panel"
      aria-labelledby={`${id}-title`}
      onSubmit={async (event) => {
        event.preventDefault();
        setState("sending");
        setError(undefined);
        try {
          await onRequestAccess(note.trim());
          setState("sent");
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : "The request did not send. Try again.");
          setState("idle");
        }
      }}
    >
      <p id={`${id}-title`} className="m-0 text-[15px]">
        Signed in as <b className="font-medium">{signedInAs}</b>
      </p>
      <Field label="Note to the owner" optional error={error} description="Say what you need it for.">
        {(props) => <Textarea {...props} value={note} onChange={(event) => setNote(event.target.value)} disabled={state === "sending"} rows={2} />}
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={state === "sending"}>Request access</Button>
      </div>
    </form>
  );
}

function Resend({ onResend }: { onResend?: () => void | Promise<void> }) {
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((left) => left - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);
  if (!onResend) return null;
  return (
    <div data-slot="error-panel">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          loading={busy}
          disabled={wait > 0}
          onClick={async () => {
            setBusy(true);
            try {
              await onResend();
              setSent(true);
              setWait(30);
            } finally {
              setBusy(false);
            }
          }}
        >
          {wait > 0 ? `Send again in 0:${String(wait).padStart(2, "0")}` : sent ? "Send another link" : "Send a new link"}
        </Button>
      </div>
      <p role="status" className="m-0 min-h-5 text-[13px] text-[var(--k-muted)]">{sent ? "A new link is on its way. It works for 30 minutes." : ""}</p>
    </div>
  );
}
