import type { ComponentProps } from "react";
import "./switch.css";

export type SwitchProps = Omit<ComponentProps<"input">, "type" | "role">;

export function Switch(props: SwitchProps) {
  return (
    <span data-slot="switch-root">
      <input data-slot="switch" {...props} type="checkbox" role="switch" />
      <span data-slot="switch-track" aria-hidden="true">
        <span data-slot="switch-thumb" />
      </span>
    </span>
  );
}
