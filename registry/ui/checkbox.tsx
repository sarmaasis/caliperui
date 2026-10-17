"use client";

import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ComponentProps,
} from "react";
import "./checkbox.css";

export type CheckboxProps = Omit<ComponentProps<"input">, "type"> & {
  indeterminate?: boolean;
};

export function Checkbox({
  ref,
  indeterminate = false,
  ...props
}: CheckboxProps) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current!, []);

  // Native activation clears mixed state. Derive this prop from the group's
  // selection; synchronize again whenever the caller renders that state.
  useLayoutEffect(() => {
    if (input.current) input.current.indeterminate = indeterminate;
  });

  return (
    <span data-slot="checkbox-root">
      <input data-slot="checkbox" {...props} type="checkbox" ref={input} />
      <span data-slot="checkbox-indicator" aria-hidden="true">
        <svg viewBox="0 0 12 12" fill="none">
          <path data-mark="check" d="M2.5 6.2 5 8.5l4.5-5" />
          <path data-mark="mixed" d="M3 6h6" />
        </svg>
      </span>
    </span>
  );
}
