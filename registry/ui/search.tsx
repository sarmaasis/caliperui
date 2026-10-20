"use client";

import { Search as SearchIcon, X } from "lucide-react";
import {
  useImperativeHandle,
  useRef,
  type ChangeEventHandler,
  type ComponentProps,
} from "react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "./lib/cn";

export type SearchProps = Omit<
  ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onClear: () => void;
  clearLabel?: string;
};

export function Search({
  value,
  onChange,
  onClear,
  clearLabel = "Clear search",
  ref,
  className,
  disabled,
  readOnly,
  ...props
}: SearchProps) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current!, []);
  return (
    <div data-slot="search" className="relative w-full min-w-0">
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        {...props}
        ref={input}
        type="search"
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          "appearance-none ps-9 pe-[calc(var(--control-height)+8px)] [&::-webkit-search-cancel-button]:appearance-none",
          className,
        )}
      />
      {value.length > 0 && !disabled && !readOnly && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={clearLabel}
          className="absolute end-0 top-0"
          onClick={() => {
            onClear();
            input.current?.focus();
          }}
        >
          <X aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
