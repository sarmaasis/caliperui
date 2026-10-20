"use client";

import { CircleCheck } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "./lib/cn";
import { tokenMs } from "./lib/motion-tokens";
import "./shared/progress-fill.css";
import "./progress.css";

function settle(amount: number) {
  const x1 = 0.22;
  const y1 = 1.2;
  const x2 = 0.36;
  const y2 = 1;
  let t = amount;
  for (let step = 0; step < 6; step += 1) {
    const u = 1 - t;
    const x = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t;
    const dx = 3 * u * u * x1 + 6 * u * t * (x2 - x1) + 3 * t * t * (1 - x2);
    if (Math.abs(x - amount) < 0.001 || dx === 0) break;
    t = Math.min(1, Math.max(0, t - (x - amount) / dx));
  }
  const u = 1 - t;
  return 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t;
}

function useSettled(target: number) {
  const current = useRef(target);
  const [shown, setShown] = useState(target);

  useEffect(() => {
    const from = current.current;
    const duration = tokenMs(document.documentElement, "--duration-deliberate");
    if (duration <= 0 || from === target) {
      current.current = target;
      setShown(target);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const amount = Math.min(1, (now - started) / duration);
      const next = from + (target - from) * settle(amount);
      current.current = next;
      setShown(next);
      if (amount < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
}

export function Progress({
  value = 0,
  max = 100,
  label,
  showValue = false,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
}) {
  const limit = Number.isFinite(max) && max > 0 ? max : 100;
  const current = Math.min(limit, Math.max(0, Number.isFinite(value) ? value : 0));
  const target = (current / limit) * 100;
  const shown = useSettled(target);
  const complete = current >= limit;
  const percent = Math.round(shown);

  return (
    <div className={cn("min-w-0", className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {label ? (
            <p className="min-w-0 text-sm font-medium">{label}</p>
          ) : (
            <span />
          )}
          {showValue && (
            <p className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground">
              <span>{percent}%</span>
              {complete && (
                <CircleCheck
                  aria-hidden="true"
                  className="size-3.5 text-success"
                  data-slot="progress-check"
                />
              )}
            </p>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={current}
        aria-valuetext={`${Math.round(target)}%`}
        aria-label={label ?? "Progress"}
        data-slot="progress"
        data-complete={complete}
        className="h-2 overflow-hidden rounded-full bg-muted"
        {...props}
      >
        <span
          data-slot="progress-fill"
          className="block h-full rounded-full bg-brand"
          style={{ width: `${shown}%` }}
        />
      </div>
    </div>
  );
}
