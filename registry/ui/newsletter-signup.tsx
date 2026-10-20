"use client";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "./button";
import { isEmail } from "./field";
import { Input } from "./input";
import { cn } from "./lib/cn";

/** One field and one button. It says what you will get, checks the address, and confirms. */
export function NewsletterSignup({
  title = "Get the changelog",
  description = "One short email when we ship something. Unsubscribe in one click.",
  buttonLabel = "Subscribe",
  successText = "You're on the list. Check your inbox to confirm.",
  onSubmit,
  note,
  className,
}: {
  title?: string;
  description?: string;
  buttonLabel?: string;
  successText?: string;
  onSubmit: (email: string) => Promise<void | { error?: string }> | void | { error?: string };
  /** Small print, such as a privacy link. */
  note?: React.ReactNode;
  className?: string;
}) {
  const [email, setEmail] = useState(""),
    [website, setWebsite] = useState(""),
    [touched, setTouched] = useState(false),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false),
    [done, setDone] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const status = useRef<HTMLDivElement>(null);
  const id = useId();
  const problem = !email.trim() ? "Enter your email address." : !isEmail(email) ? "Enter a valid email address, like name@example.com." : "";
  const shown = (touched && problem) || error;

  useEffect(() => {
    if (done) status.current?.focus();
  }, [done]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setTouched(true);
    setError("");
    if (problem) {
      input.current?.focus();
      return;
    }
    if (website) {
      setDone(true);
      return;
    }
    setPending(true);
    try {
      const result = await onSubmit(email.trim());
      if (result && result.error) setError(result.error);
      else setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section data-slot="newsletter" aria-labelledby={`${id}-title`} className={cn("mx-auto grid w-full max-w-xl gap-4 px-4 py-10 text-center sm:px-6", className)}>
      <div className="grid gap-1.5">
        <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {done ? (
        <div ref={status} tabIndex={-1} role="status" className="mx-auto flex items-center gap-2 text-sm outline-none">
          <CheckCircle2 aria-hidden="true" className="size-5 text-success" />
          {successText}
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="grid gap-2 text-left">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor={`${id}-email`} className="sr-only">
              Email address
            </label>
            <Input
              ref={input}
              id={`${id}-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              value={email}
              disabled={pending}
              aria-invalid={shown ? true : undefined}
              aria-describedby={shown ? `${id}-error` : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              onBlur={() => email && setTouched(true)}
              className="sm:flex-1"
            />
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <Button type="submit" loading={pending}>
              {pending ? "Subscribing…" : buttonLabel}
            </Button>
          </div>
          <p id={`${id}-error`} role={shown ? "alert" : undefined} className={cn("text-xs leading-[18px] text-danger", !shown && "hidden")}>
            {shown}
          </p>
          {note && <p className="text-center text-xs text-muted-foreground">{note}</p>}
        </form>
      )}
    </section>
  );
}
