"use client";

import * as Primitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import {
  useId,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Button, type ButtonProps } from "./button";
import { FeedbackIcon, type FeedbackVariant } from "./feedback";
import { cn } from "./lib/cn";
import "./shared/alert.css";
import "./toast.css";

export type ToastProps = Omit<
  ComponentProps<typeof Primitive.Root>,
  "title" | "children" | "asChild"
> & {
  title: ReactNode;
  variant?: FeedbackVariant;
  loading?: boolean;
  children?: ReactNode;
  action?: {
    label: string;
    altText: string;
    onClick: ButtonProps["onClick"];
    disabled?: boolean;
  };
};

export function ToastProvider({
  duration = 6000,
  label = "Notification",
  swipeDirection = "right",
  ...props
}: ComponentProps<typeof Primitive.Provider>) {
  return (
    <Primitive.Provider
      duration={duration}
      label={label}
      swipeDirection={swipeDirection}
      {...props}
    />
  );
}

export function Toast({
  title,
  variant = "neutral",
  loading = false,
  children,
  action,
  className,
  style,
  duration,
  ...props
}: ToastProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number>();
  const [instantLayout, setInstantLayout] = useState(false);
  const previousMessage = useRef<{ node: HTMLDivElement; text: string } | null>(null);
  const announcement = useRef<HTMLSpanElement>(null);
  const messageKey = loading ? "loading" : variant;
  useLayoutEffect(() => {
    if (!content) return;
    let previousWidth: number | undefined;
    let previousDensity: string | undefined;
    let previousHeight: number | undefined;
    const measure = () => {
      const bounds = content.getBoundingClientRect();
      const density = getComputedStyle(content).getPropertyValue("--control-height");
      if (previousWidth !== undefined && (previousWidth !== bounds.width || previousDensity !== density)) {
        setInstantLayout(true);
      } else if (previousHeight !== bounds.height) {
        setInstantLayout(false);
      }
      setHeight(bounds.height);
      previousWidth = bounds.width;
      previousDensity = density;
      previousHeight = bounds.height;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [content]);
  useEffect(() => {
    if (!content) {
      previousMessage.current = null;
      if (announcement.current) announcement.current.textContent = "";
      return;
    }
    const text = [
      content.querySelector('[data-slot="feedback-title"]')?.textContent,
      content.querySelector('[data-slot="feedback-description"]')?.textContent,
    ].filter(Boolean).join(" ");
    if (
      previousMessage.current?.node === content &&
      previousMessage.current.text !== text &&
      content.parentElement?.dataset.state === "open" &&
      announcement.current
    ) {
      announcement.current.textContent = text;
    }
    previousMessage.current = { node: content, text };
  }, [content, title, children]);

  return (
    <>
    <Primitive.Root
      data-slot="toast"
      data-variant={loading ? "neutral" : variant}
      data-layout={instantLayout ? "instant" : undefined}
      aria-busy={loading || undefined}
      // Errors stay until dismissed; pending work never times out mid-way.
      duration={duration ?? (variant === "error" || loading ? Infinity : undefined)}
      aria-labelledby={titleId}
      aria-describedby={children != null ? descriptionId : undefined}
      className={cn(
        "block min-w-0 shrink-0 rounded-surface bg-elevated text-sm text-foreground shadow-feedback outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [overflow-wrap:anywhere]",
        className,
      )}
      style={{
        touchAction: "var(--caliper-toast-touch-action, none)",
        "--caliper-toast-block-size": height === undefined ? undefined : `${height}px`,
        ...style,
      } as CSSProperties}
      {...props}
    >
      <div
        ref={setContent}
        data-slot="toast-content"
        className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-3"
      >
        <FeedbackIcon variant={variant} loading={loading} />
        <div data-slot="feedback-copy" className="min-w-0 pt-1">
          <Primitive.Title id={titleId} data-slot="feedback-title" className="font-semibold leading-5">
            <span key={messageKey} data-slot="feedback-message">{title}</span>
          </Primitive.Title>
          {children != null && (
            <Primitive.Description
              id={descriptionId}
              data-slot="feedback-description"
              className="mt-1 text-sm leading-5 text-muted-foreground"
            >
              <span key={messageKey} data-slot="feedback-message">{children}</span>
            </Primitive.Description>
          )}
          {action && (
            <div data-slot="feedback-action" className="mt-3">
              <Primitive.Action asChild altText={action.altText}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-auto min-h-8 max-w-full py-1.5 whitespace-normal text-left"
                  disabled={action.disabled}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              </Primitive.Action>
            </div>
          )}
        </div>
        <Primitive.Close asChild>
          <Button
            variant="ghost"
            size="icon"
            className="-mt-1 -mr-1"
            aria-label="Dismiss notification"
          >
            <X aria-hidden="true" />
          </Button>
        </Primitive.Close>
      </div>
    </Primitive.Root>
    <span ref={announcement} data-slot="toast-update-announcement" className="sr-only" aria-live="polite" aria-atomic="true" />
    </>
  );
}

export function ToastStack({
  className,
  label = "Notifications ({hotkey})",
  ...props
}: ComponentProps<typeof Primitive.Viewport>) {
  return (
    <Primitive.Viewport
      data-slot="toast-stack"
      label={label}
      className={cn(
        "fixed right-0 bottom-0 z-[60] m-0 flex max-h-[100dvh] w-full max-w-[26rem] list-none flex-col-reverse overflow-y-auto p-4 outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}
