"use client";

import { Eye } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "./lib/cn";
import "./password-field.css";

export function PasswordField({
  label,
  description,
  id,
  messages,
  className,
  onFocus,
  onBlur,
  onKeyUp,
  ...props
}: {
  label: string;
  description?: string;
  messages?: { show?: string; hide?: string };
} & Omit<ComponentProps<"input">, "type">) {
  const generated = useId();
  const fieldId = id ?? generated;
  const descriptionId = `${fieldId}-description`;
  const capsId = `${fieldId}-caps`;
  const [visible, setVisible] = useState(false);
  const [caps, setCaps] = useState(false);
  const [focused, setFocused] = useState(false);
  const show = messages?.show ?? "Show password";
  const hide = messages?.hide ?? "Hide password";
  const describedBy = [description ? descriptionId : null, focused && caps ? capsId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        <Input
          {...props}
          id={fieldId}
          type={visible ? "text" : "password"}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-describedby={describedBy}
          className="pr-11"
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onKeyUp={(event) => {
            setCaps(event.getModifierState("CapsLock"));
            onKeyUp?.(event);
          }}
        />
        <button
          type="button"
          aria-pressed={visible}
          aria-label={visible ? hide : show}
          className="absolute top-1/2 right-1 grid size-8 -translate-y-1/2 place-items-center rounded-control text-muted-foreground outline-none hover:text-foreground focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={() => setVisible((value) => !value)}
        >
          <span className="relative grid size-4 place-items-center">
            <Eye aria-hidden="true" className="size-4" />
            <span data-slot="password-slash" data-drawn={!visible} />
          </span>
        </button>
      </div>
      {description ? (
        <p id={descriptionId} className="text-xs leading-[18px] text-muted-foreground">
          {description}
        </p>
      ) : null}
      <p id={capsId} role="status" className={cn("text-xs leading-[18px] text-warning", !(focused && caps) && "sr-only")}>
        {focused && caps ? "Caps Lock is on." : ""}
      </p>
    </div>
  );
}
