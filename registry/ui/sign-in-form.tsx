"use client";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Alert } from "./alert";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Field, isEmail } from "./field";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "./lib/cn";
import { PasswordField } from "./password-field";

export type AuthProvider = { id: string; label: string; icon?: ReactNode; onClick: () => void };
export type SignInResult = void | { error?: string; fields?: { email?: string; password?: string } };

export function Providers({ providers, disabled, verb = "Continue with" }: { providers: readonly AuthProvider[]; disabled?: boolean; verb?: string }) {
  return (
    <div className="grid gap-2">
      <div className="grid gap-2">
        {providers.map((p) => (
          <Button key={p.id} type="button" variant="secondary" disabled={disabled} onClick={p.onClick}>
            {p.icon}
            {verb} {p.label}
          </Button>
        ))}
      </div>
      <div role="separator" aria-label="or" className="flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        or
      </div>
    </div>
  );
}

/** Email and password sign in with inline validation, a server error area and optional single sign-on buttons. */
export function SignInForm({
  title = "Sign in",
  description,
  onSubmit,
  providers,
  forgotHref,
  onForgot,
  signUp,
  rememberMe = true,
  defaultEmail = "",
  className,
}: {
  title?: string;
  description?: string;
  onSubmit: (values: { email: string; password: string; remember: boolean }) => Promise<SignInResult> | SignInResult;
  providers?: readonly AuthProvider[];
  forgotHref?: string;
  onForgot?: () => void;
  /** Where people without an account go. */
  signUp?: { href?: string; onClick?: () => void };
  rememberMe?: boolean;
  defaultEmail?: string;
  className?: string;
}) {
  const [values, setValues] = useState({ email: defaultEmail, password: "", remember: true });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [server, setServer] = useState<{ error?: string; fields?: { email?: string; password?: string } }>({});
  const [pending, setPending] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const refocus = useRef<string | null>(null);
  // Fields are disabled while sending; move focus to the first problem once they can take it.
  useEffect(() => {
    if (pending || !refocus.current) return;
    form.current?.querySelector<HTMLElement>(`[name="${refocus.current}"]`)?.focus();
    refocus.current = null;
  }, [pending]);

  const local = {
    email: !values.email.trim() ? "Enter your email address." : !isEmail(values.email) ? "Enter a valid email address, like name@example.com." : "",
    password: !values.password ? "Enter your password." : "",
  };
  const errors = {
    email: (touched.email && local.email) || server.fields?.email || "",
    password: (touched.password && local.password) || server.fields?.password || "",
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setTouched({ email: true, password: true });
    setServer({});
    const first = local.email ? "email" : local.password ? "password" : null;
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setPending(true);
    let target: string | null = null;
    try {
      const result = await onSubmit({ email: values.email.trim(), password: values.password, remember: values.remember });
      if (result && (result.error || result.fields)) {
        setServer(result);
        target = result.fields?.email ? "email" : result.fields?.password ? "password" : null;
      }
    } catch (error) {
      setServer({ error: error instanceof Error ? error.message : "Something went wrong. Try again." });
    } finally {
      setPending(false);
    }
    if (target) refocus.current = target;
  };

  return (
    <form ref={form} noValidate data-slot="sign-in-form" aria-label={title} onSubmit={submit} className={cn("grid gap-5", className)}>
      <div className="grid gap-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {server.error && (
        <Alert variant="error" title={server.error} />
      )}
      {providers && providers.length > 0 && <Providers providers={providers} disabled={pending} />}
      <Field label="Email" error={errors.email} required>
        {(control) => (
          <Input
            {...control}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={values.email}
            disabled={pending}
            onChange={(e) => {
              setValues({ ...values, email: e.target.value });
              if (server.fields?.email || server.error) setServer({});
            }}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          />
        )}
      </Field>
      <div className="grid gap-1.5">
        <div className="relative">
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            required
            aria-invalid={errors.password ? true : undefined}
            value={values.password}
            disabled={pending}
            onChange={(e) => {
              setValues({ ...values, password: e.target.value });
              if (server.fields?.password || server.error) setServer({});
            }}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          />
          {(forgotHref || onForgot) && (
            <a
              href={forgotHref ?? "#"}
              onClick={(event) => {
                if (onForgot) {
                  event.preventDefault();
                  onForgot();
                }
              }}
              className="absolute right-0 top-0 rounded-control text-xs text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Forgot password?
            </a>
          )}
        </div>
        {errors.password && (
          <p role="alert" className="text-xs leading-[18px] text-danger">
            {errors.password}
          </p>
        )}
      </div>
      {rememberMe && (
        <div className="flex items-center gap-2">
          <Checkbox id="remember" checked={values.remember} disabled={pending} onChange={(e) => setValues({ ...values, remember: e.target.checked })} />
          <Label htmlFor="remember" className="font-normal">
            Keep me signed in on this device
          </Label>
        </div>
      )}
      <Button type="submit" loading={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      {signUp && (
        <p className="text-center text-sm text-muted-foreground">
          No account yet?{" "}
          <a
            href={signUp.href ?? "#"}
            onClick={(event) => {
              if (signUp.onClick) {
                event.preventDefault();
                signUp.onClick();
              }
            }}
            className="rounded-control font-medium text-foreground underline underline-offset-4 outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Create one
          </a>
        </p>
      )}
    </form>
  );
}
