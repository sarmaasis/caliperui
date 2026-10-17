"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import * as Primitive from "@radix-ui/react-dropdown-menu";
import "./split-button.css";

export type SplitAction = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
};

export type SplitOption = {
  value: string;
  label: string;
  /** One line on what this choice does, e.g. "4 commits become one on main". */
  description?: string;
  disabled?: boolean;
};

type Shared = Omit<ButtonProps, "children" | "onClick" | "size"> & {
  menuLabel?: string;
  size?: "sm" | "md" | "lg";
};

type ActionsMode = Shared & {
  /** Alternatives that run immediately from the menu. */
  actions: readonly SplitAction[];
  children: ReactNode;
  onClick?: ButtonProps["onClick"];
  options?: never;
};

type ChoiceMode = Shared & {
  /** Choices; the selected one becomes the button's label. */
  options: readonly SplitOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Runs the selected option. */
  onRun: (value: string) => void;
  /** Small heading above the options, e.g. "Merge method". */
  menuHeading?: string;
  icon?: ReactNode;
  actions?: never;
};

const optionRow =
  "items-start py-2 pl-8 max-md:min-h-[52px] [&_[data-slot=split-check]]:absolute [&_[data-slot=split-check]]:left-2.5 [&_[data-slot=split-check]]:top-2.5";

/**
 * A primary action joined to its close alternatives. In choice mode the
 * chosen option becomes the label, and every option states its consequence.
 */
export function SplitButton(props: ActionsMode | ChoiceMode) {
  const { menuLabel = "More actions", variant = "default", size = "md", disabled } = props;
  const [inner, setInner] = useState(
    props.options ? (props.defaultValue ?? props.options.find((o) => !o.disabled)?.value ?? "") : "",
  );

  const triggerClass = size === "lg" ? "size-11 rounded-l-none" : size === "sm" ? "size-8 rounded-l-none" : "rounded-l-none";

  if (props.options) {
    const { options, value, onValueChange, onRun, menuHeading, icon } = props;
    const current = value ?? inner;
    const selected = options.find((o) => o.value === current) ?? options[0];
    const choose = (next: string) => {
      if (value === undefined) setInner(next);
      onValueChange?.(next);
    };
    return (
      <div data-slot="split-button" className="inline-flex items-stretch gap-px">
        <Button
          variant={variant}
          size={size}
          disabled={disabled}
          className="rounded-r-none"
          onClick={() => onRun(selected.value)}
        >
          {icon}
          {selected.label}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={variant} size="icon" disabled={disabled} aria-label={menuLabel} className={triggerClass}>
              <ChevronDown data-slot="split-chevron" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {menuHeading && <DropdownMenuLabel>{menuHeading}</DropdownMenuLabel>}
            <DropdownMenuRadioGroup value={selected.value} onValueChange={choose}>
              {options.map((option) => (
                <Primitive.RadioItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  data-slot="dropdown-item"
                  className={`relative z-10 flex cursor-default select-none gap-2.5 rounded-[8px] px-2.5 text-[13px] outline-none data-[disabled]:opacity-60 ${optionRow}`}
                >
                  <span data-slot="split-check" className="flex size-4 items-center justify-center">
                    <Primitive.ItemIndicator>
                      <Check className="size-4" aria-hidden="true" />
                    </Primitive.ItemIndicator>
                  </span>
                  <span className="grid gap-0.5">
                    <span className="text-sm font-medium">{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    )}
                  </span>
                </Primitive.RadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  const { actions, children, onClick, ...rest } = props;
  delete (rest as Partial<ActionsMode>).menuLabel;
  delete (rest as Partial<ActionsMode>).variant;
  delete (rest as Partial<ActionsMode>).size;
  return (
    <div data-slot="split-button" className="inline-flex items-stretch gap-px">
      <Button variant={variant} size={size} className="rounded-r-none" onClick={onClick} {...rest}>
        {children}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" disabled={disabled} aria-label={menuLabel} className={triggerClass}>
            <ChevronDown data-slot="split-chevron" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.label}
              disabled={action.disabled}
              onSelect={action.onSelect}
              className="max-md:min-h-[52px]"
            >
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
