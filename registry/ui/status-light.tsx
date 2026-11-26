"use client";
import type { ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./status-light.css";

export type LightState = "ok" | "warn" | "fail" | "running" | "idle";

export type StatusLightProps = Omit<ComponentProps<"div">, "children"> & {
  state: LightState;
  /** The word beside the lamps. Defaults to a plain name for the state; pass "" to show lamps only. */
  label?: string;
  orientation?: "vertical" | "horizontal";
};

const names: Record<LightState, string> = { ok: "Healthy", warn: "Degraded", fail: "Down", running: "Running", idle: "Idle" };
const lamps = ["fail", "warn", "ok"] as const;

/**
 * A three-lamp signal for a service or a build: red, amber, green. One lamp lights at a time and the others
 * stay dark; "running" breathes the amber lamp, "idle" lights none. Lamps come on quickly and fade out slowly,
 * the way a bulb does. The state is always written as text beside the lamps, so colour never carries it alone.
 * Under reduced motion the running lamp stays lit and lamps change without fading.
 */
export function StatusLight({ state, label, orientation = "vertical", className, ...props }: StatusLightProps) {
  const text = label ?? names[state];
  const lit = state === "running" ? "warn" : state === "idle" ? null : state;
  return (
    <div
      role="status"
      aria-label={text ? undefined : names[state]}
      data-slot="status-light"
      data-state={state}
      data-orientation={orientation}
      className={cn("inline-flex items-center gap-3", className)}
      {...props}
    >
      <span data-slot="stl-lamps" aria-hidden="true">
        {lamps.map((lamp) => (
          <i key={lamp} data-slot="stl-lamp" data-lamp={lamp} data-on={lamp === lit ? "" : undefined} />
        ))}
      </span>
      {text ? <span data-slot="stl-label">{text}</span> : null}
    </div>
  );
}
