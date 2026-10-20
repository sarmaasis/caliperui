"use client";

import { ArrowRight, CircleCheck, Clock, MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent } from "react";
import { Alert } from "./alert";
import { BlockEyebrow, BlockLead, BlockRoot, BlockTitle, type BlockAction } from "./block-concept";
import type { BlockNavLink } from "./block-nav";
import { Button } from "./button";
import { FaqBlock } from "./faq-block";
import { Field, isEmail } from "./field";
import { Input } from "./input";
import { SelectMenu } from "./select-menu";
import { TemplatePage, type TemplateFooter } from "./template-page";
import { Textarea } from "./textarea";
import "./contact-template.css";

type Without<T> = Omit<T, "className">;

export type ContactTopic = {
  /** Sent with the message, e.g. "sales". */
  value: string;
  label: string;
  /** Who answers and when, e.g. "The sales team replies within one working day." */
  response: string;
  /** A direct address for this topic, shown in the channel list. */
  email?: string;
};

export type ContactOffice = { city: string; address: string; hours?: string; timezone?: string; mapHref?: string };

export type ContactMessage = { topic: string; name: string; email: string; company: string; message: string };

type Errors = Partial<Record<"name" | "email" | "message", string>>;

const check = (values: ContactMessage): Errors => ({
  ...(values.name.trim() ? {} : { name: "Enter your name." }),
  ...(isEmail(values.email) ? {} : { email: values.email.trim() ? "Enter an email address like name@company.com." : "Enter your email address." }),
  ...(values.message.trim().length >= 20 ? {} : { message: `Tell us a little more: at least 20 characters (${values.message.trim().length} so far).` }),
});

/**
 * A contact page that routes the message before it is written: choose
 * what it is about and the page says who answers and how soon. The form
 * validates where you are, keeps what you typed if sending fails, and ends
 * on a confirmation that names where the reply will go. Offices and the
 * usual questions follow. Built only from the Free blocks.
 */
export function ContactTemplate({
  brand,
  nav,
  signIn,
  primary,
  intro,
  topics,
  offices = [],
  faq,
  onSubmit,
  footer,
  className,
}: {
  brand: string;
  nav?: readonly BlockNavLink[];
  signIn?: BlockAction;
  primary?: BlockAction;
  intro: { eyebrow?: string; title: string; lead?: string };
  topics: readonly ContactTopic[];
  offices?: readonly ContactOffice[];
  faq?: Without<ComponentProps<typeof FaqBlock>>;
  /** Send the message. A thrown error is shown above the form and nothing typed is lost. */
  onSubmit: (message: ContactMessage) => void | Promise<void>;
  footer?: TemplateFooter;
  className?: string;
}) {
  const id = useId();
  const empty: ContactMessage = { topic: topics[0]?.value ?? "", name: "", email: "", company: "", message: "" };
  const [values, setValues] = useState<ContactMessage>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string>();
  const [sent, setSent] = useState<ContactMessage | null>(null);
  const trap = useRef<HTMLInputElement>(null);
  const refs = { name: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), message: useRef<HTMLTextAreaElement>(null) };
  const done = useRef<HTMLHeadingElement>(null);
  const topic = topics.find((item) => item.value === values.topic) ?? topics[0];

  useEffect(() => {
    if (sent) done.current?.focus();
  }, [sent]);

  const set = (key: keyof ContactMessage, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touched[key]) setErrors(check(next));
  };
  const blur = (key: keyof Errors) => {
    setTouched((current) => ({ ...current, [key]: true }));
    setErrors((current) => ({ ...current, [key]: check(values)[key] }));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (trap.current?.value) return setSent(values); // A bot filled the hidden field: pretend it went.
    const found = check(values);
    setErrors(found);
    setTouched({ name: true, email: true, message: true });
    const first = (["name", "email", "message"] as const).find((key) => found[key]);
    if (first) return refs[first].current?.focus();
    setSending(true);
    setFailure(undefined);
    try {
      await onSubmit(values);
      setSent(values);
    } catch (reason) {
      setFailure(reason instanceof Error ? reason.message : "The message did not send. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <TemplatePage brand={brand} nav={nav} signIn={signIn} primary={primary} footer={footer} className={className}>
      <BlockRoot>
        <div data-slot="contact-layout">
          <div className="grid content-start gap-6">
            {intro.eyebrow && <BlockEyebrow>{intro.eyebrow}</BlockEyebrow>}
            <BlockTitle as="h1" size={2} className="max-w-[12ch]">{intro.title}</BlockTitle>
            {intro.lead && <BlockLead>{intro.lead}</BlockLead>}
            <ul data-slot="contact-channels" aria-label="Who answers what">
              {topics.map((item) => (
                <li key={item.value}>
                  <span className="text-[15px] font-medium">{item.label}</span>
                  <span className="text-[14px] leading-relaxed text-[var(--k-muted)]">{item.response}</span>
                  {item.email && <a href={`mailto:${item.email}`} className="text-[14px] underline underline-offset-4">{item.email}</a>}
                </li>
              ))}
            </ul>
          </div>

          <div data-slot="contact-card">
            {sent ? (
              <div className="grid justify-items-start gap-4" role="status">
                <CircleCheck aria-hidden="true" className="size-8 text-[var(--k-hi)]" />
                <h2 ref={done} tabIndex={-1} className="m-0 text-[24px] font-medium tracking-[-0.02em] outline-none">Message sent</h2>
                <p className="m-0 text-[15px] leading-relaxed text-[var(--k-muted)]">
                  Thanks, {sent.name.split(" ")[0]}. {topics.find((item) => item.value === sent.topic)?.response} We will reply to <b className="font-medium text-[var(--k-ink)]">{sent.email}</b>.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSent(null);
                    setValues({ ...empty, name: sent.name, email: sent.email, company: sent.company });
                    setTouched({});
                    setErrors({});
                  }}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form noValidate onSubmit={submit} className="grid gap-4" aria-labelledby={`${id}-form`}>
                <h2 id={`${id}-form`} className="m-0 text-[20px] font-medium tracking-[-0.01em]">Send a message</h2>
                {failure && <Alert variant="error" title="Not sent">{failure} Your message is still here.</Alert>}
                <div className="grid gap-1.5">
                  <span id={`${id}-topic`} className="text-sm font-medium">What is it about?</span>
                  <SelectMenu aria-labelledby={`${id}-topic`} name="topic" options={topics.map((item) => ({ value: item.value, label: item.label }))} value={values.topic} onValueChange={(value) => set("topic", value)} disabled={sending} />
                  <p className="m-0 flex items-center gap-1.5 text-[13px] text-[var(--k-muted)]" aria-live="polite">
                    <Clock aria-hidden="true" className="size-3.5 shrink-0" />
                    {topic?.response}
                  </p>
                </div>
                <div data-slot="contact-pair">
                  <Field label="Name" required error={errors.name}>
                    {(props) => <Input {...props} ref={refs.name} name="name" autoComplete="name" value={values.name} disabled={sending} onChange={(e) => set("name", e.target.value)} onBlur={() => blur("name")} />}
                  </Field>
                  <Field label="Work email" required error={errors.email}>
                    {(props) => <Input {...props} ref={refs.email} name="email" type="email" autoComplete="email" value={values.email} disabled={sending} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} />}
                  </Field>
                </div>
                <Field label="Company" optional>
                  {(props) => <Input {...props} name="company" autoComplete="organization" value={values.company} disabled={sending} onChange={(e) => set("company", e.target.value)} />}
                </Field>
                <Field label="Message" required error={errors.message} count={`${values.message.length} / 2000`}>
                  {(props) => <Textarea {...props} ref={refs.message} name="message" maxLength={2000} value={values.message} disabled={sending} onChange={(e) => set("message", e.target.value)} onBlur={() => blur("message")} />}
                </Field>
                <input ref={trap} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" size="lg" loading={sending}>
                    Send message
                    <ArrowRight aria-hidden="true" />
                  </Button>
                  <span className="text-[13px] text-[var(--k-muted)]">We only use your details to reply.</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </BlockRoot>

      {offices.length > 0 && (
        <BlockRoot tone="sunken" aria-labelledby={`${id}-offices`}>
          <BlockTitle id={`${id}-offices`} size={3} className="!mb-8">Offices</BlockTitle>
          <ul data-slot="contact-offices">
            {offices.map((office) => (
              <li key={office.city}>
                <span data-slot="contact-map" aria-hidden="true">
                  <MapPin />
                </span>
                <span className="text-[20px] font-medium tracking-[-0.01em]">{office.city}</span>
                <address className="text-[15px] not-italic leading-relaxed text-[var(--k-muted)]">{office.address}</address>
                {(office.hours || office.timezone) && (
                  <span className="text-[13px] text-[var(--k-muted)]">
                    {office.hours}
                    {office.hours && office.timezone && " · "}
                    {office.timezone}
                  </span>
                )}
                {office.mapHref && <a href={office.mapHref} className="text-[14px] underline underline-offset-4">Directions<span className="sr-only"> to the {office.city} office</span></a>}
              </li>
            ))}
          </ul>
        </BlockRoot>
      )}

      {faq && <FaqBlock {...faq} />}
    </TemplatePage>
  );
}
