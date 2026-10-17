"use client";

import type { ComponentProps, ReactElement, ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "./dropdown-menu";

export type UserMenuProps = ComponentProps<typeof DropdownMenu> & {
  trigger: ReactElement;
  children: ReactNode;
  contentProps?: ComponentProps<typeof DropdownMenuContent>;
};

/** Identity and actions belong to the caller; no session behavior is implied. */
export function UserMenu({
  trigger,
  children,
  contentProps,
  ...props
}: UserMenuProps) {
  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" {...contentProps}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
