import type { ComponentProps } from "react";
import "./radio.css";

export type RadioProps = Omit<ComponentProps<"input">, "type">;

export function Radio(props: RadioProps) {
  return (
    <span data-slot="radio-root">
      <input data-slot="radio" {...props} type="radio" />
      <span data-slot="radio-indicator" aria-hidden="true" />
    </span>
  );
}
