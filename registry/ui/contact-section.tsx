"use client";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Alert } from "./alert";
import { Button } from "./button";
import { Field, isEmail } from "./field";
import { Input } from "./input";
import { cn } from "./lib/cn";
import { SelectMenu } from "./select-menu";
import { Textarea } from "./textarea";

export type ContactDetail = { label: string; value: string; href?: string };
export type ContactResult = void | { error?: string; fields?: { name?: string; email?: string; message?: string } };

/** A contact form beside a few direct ways to reach you. It sends nothing itself and keeps the message if sending fails. */
export function ContactSection({
  title = "Contact us",
  description,
  details,
  topics,
  onSubmit,
  successTitle = "Message sent",
  successText = "Thanks. We will reply within one business day.",
  className,
}: {
  title?: string;
  description?: string;
  details?: readonly ContactDetail[];
  topics?: readonly string[];
  onSubmit: (values: { name: string; email: string; topic: string; message: string }) => Promise<ContactResult> | ContactResult;
  successTitle?: string;
  successText?: string;
  className?: string;
}) {
  const [values, setValues] = useState({ name: "", email: "", topic: topics?.[0] ?? "", message: "", website: "" });
  const [touched, setTouched] = useState({ name: false, email: false, message: false });
  const [server, setServer] = useState<{ error?: string; fields?: { name?: string; email?: string; message?: string } }>({});
  const [pending, setPending] = useState(false),
    [sent, setSent] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const refocus = useRef<string | null>(null);
  const heading = useId();
  const thanks = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pending || !refocus.current) return;
    form.current?.querySelector<HTMLElement>(`[name="${refocus.current}"]`)?.focus();
    refocus.current = null;
  }, [pending]);
  useEffect(() => {
    if (sent) thanks.current?.focus();
  }, [sent]);

  const local = {
    name: !values.name.trim() ? "Tell us your name." : "",
    email: !values.email.trim() ? "Enter your email address." : !isEmail(values.email) ? "Enter a valid email address, like name@example.com." : "",
    message: values.message.trim().length < 10 ? "Write a few words about what you need (at least 10 characters)." : "",
  };
  const errors = {
    name: (touched.name && local.name) || server.fields?.name || "",
    email: (touched.email && local.email) || server.fields?.email || "",
    message: (touched.message && local.message) || server.fields?.message || "",
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setTouched({ name: true, email: true, message: true });
    setServer({});
    const first = (["name", "email", "message"] as const).find((k) => local[k]);
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    // Real people never see the hidden field; if it has text, pretend it worked.
    if (values.website) {
      setSent(true);
      return;
    }
    setPending(true);
    let target: string | undefined;
    try {
      const result = await onSubmit({ name: values.name.trim(), email: values.email.trim(), topic: values.topic, message: values.message.trim() });
      if (result && (result.error || result.fields)) {
        setServer(result);
        target = (["name", "email", "message"] as const).find((k) => result.fields?.[k]);
      } else setSent(true);
    } catch (error) {
      setServer({ error: error instanceof Error ? error.message : "Something went wrong. Your message is still here; try again." });
    } finally {
      setPending(false);
    }
    if (target) refocus.current = target;
  };

  return (
    <section data-slot="contact" aria-labelledby={heading} className={cn("mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]", className)}>
      <div className="grid content-start gap-4">
        <h2 id={heading} className="text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
        {details && details.length > 0 && (
          <dl className="mt-2 grid gap-4 text-sm">
            {details.map((d) => (
              <div key={d.label}>
                <dt className="text-xs text-muted-foreground">{d.label}</dt>
                <dd className="mt-0.5">
                  {d.href ? (
                    <a href={d.href} className="rounded-control underline underline-offset-4 outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                      {d.value}
                    </a>
                  ) : (
                    d.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="rounded-overlay border border-border bg-background p-5 sm:p-6">
        {sent ? (
          <div ref={thanks} tabIndex={-1} role="status" className="grid justify-items-start gap-3 outline-none">
            <CheckCircle2 aria-hidden="true" className="size-6 text-success" />
            <h3 className="text-lg font-semibold">{successTitle}</h3>
            <p className="text-sm text-muted-foreground">{successText}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSent(false);
                setValues({ name: "", email: "", topic: topics?.[0] ?? "", message: "", website: "" });
                setTouched({ name: false, email: false, message: false });
              }}
            >
              Send another message
            </Button>
          </div>
        ) : (
          <form ref={form} noValidate aria-labelledby={heading} onSubmit={submit} className="grid gap-4">
            {server.error && <Alert variant="error" title={server.error} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={errors.name} required>
                {(control) => <Input {...control} name="name" autoComplete="name" value={values.name} disabled={pending} onChange={(e) => setValues({ ...values, name: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, name: true }))} />}
              </Field>
              <Field label="Email" error={errors.email} required>
                {(control) => (
                  <Input {...control} name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={values.email} disabled={pending} onChange={(e) => setValues({ ...values, email: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, email: true }))} />
                )}
              </Field>
            </div>
            {topics && topics.length > 0 && (
              <Field label="Topic">
                {(control) => (
                  <SelectMenu {...control} name="topic" value={values.topic} disabled={pending} onValueChange={(topic) => setValues({ ...values, topic })} options={topics.map((t) => ({ value: t, label: t }))} />
                )}
              </Field>
            )}
            <Field label="Message" error={errors.message} required description={`${values.message.trim().length} characters`}>
              {(control) => <Textarea {...control} name="message" rows={5} value={values.message} disabled={pending} onChange={(e) => setValues({ ...values, message: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, message: true }))} />}
            </Field>
            {/* Hidden from people; automated forms fill it in. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => setValues({ ...values, website: e.target.value })} />
              </label>
            </div>
            <Button type="submit" loading={pending} className="justify-self-start">
              {pending ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
