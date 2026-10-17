"use client";

import { useImperativeHandle, useRef, useState, type ComponentProps } from "react";
import { GlideHighlight, glideBox, type GlideBox } from "./glide-highlight";
import { cn } from "./lib/cn";
import "./button-group.css";

export function ButtonGroup({
  ref,
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  const group = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => group.current!, []);
  const [box, setBox] = useState<GlideBox | null>(null);

  function place(target: EventTarget | null) {
    const button =
      target instanceof Element
        ? target.closest<HTMLElement>("[data-slot=button]")
        : null;
    if (!button || !group.current?.contains(button)) return;
    setBox(glideBox(button));
  }

  function rest(next: EventTarget | null) {
    const button =
      next instanceof Element
        ? next.closest<HTMLElement>("[data-slot=button]")
        : null;
    if (button && group.current?.contains(button)) return;
    setBox((current) => (current ? { ...current, active: false } : null));
  }

  return (
    <div
      {...props}
      ref={group}
      role="group"
      data-slot="button-group"
      onPointerMove={(event) => place(event.target)}
      onPointerLeave={() => rest(null)}
      onFocus={(event) => place(event.target)}
      onBlur={(event) => rest(event.relatedTarget)}
      className={cn(
        "relative inline-flex max-w-full items-stretch gap-0.5 rounded-touch bg-raised p-[3px] shadow-raised [&>[data-slot=button]]:h-[calc(var(--control-height)-6px)] [&>[data-slot=button]]:rounded-[9px] [&>[data-slot=button][data-size=icon]]:w-[calc(var(--control-height)-6px)]",
        className,
      )}
    >
      <GlideHighlight box={box} />
      {children}
    </div>
  );
}
