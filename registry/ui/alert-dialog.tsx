"use client";

import type { ComponentProps } from "react";
import { Button, type ButtonProps } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { useDirection } from "./direction";

export const AlertDialog = Dialog;
export const AlertDialogTrigger = DialogTrigger;
export const AlertDialogHeader = DialogHeader;
export const AlertDialogFooter = DialogFooter;
export const AlertDialogTitle = DialogTitle;
export const AlertDialogDescription = DialogDescription;

/**
 * The Dialog surface for a decision that cannot be undone. It has no close button and does
 * not close on an outside click; Escape and Cancel dismiss it. Focus starts on Cancel, the
 * safe choice, and returns to the trigger. Give it a title and a description.
 */
export function AlertDialogContent({
  children,
  onOpenAutoFocus,
  ...props
}: Omit<ComponentProps<typeof DialogContent>, "showCloseButton" | "role">) {
  const dir = useDirection();
  return (
    <DialogContent
      role="alertdialog"
      dir={dir}
      showCloseButton={false}
      onPointerDownOutside={(event) => event.preventDefault()}
      onInteractOutside={(event) => event.preventDefault()}
      onOpenAutoFocus={(event) => {
        onOpenAutoFocus?.(event);
        if (event.defaultPrevented) return;
        const cancel = event.currentTarget instanceof HTMLElement ? event.currentTarget.querySelector<HTMLElement>("[data-alert-cancel]") : null;
        if (cancel) {
          event.preventDefault();
          cancel.focus();
        }
      }}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

/** Closes without doing anything. Put it first in the footer; it takes focus when the dialog opens. */
export function AlertDialogCancel({ children = "Cancel", ...props }: Omit<ButtonProps, "variant" | "asChild">) {
  return (
    <DialogClose asChild>
      <Button variant="secondary" data-alert-cancel="" {...props}>
        {children}
      </Button>
    </DialogClose>
  );
}

/** The action. Say what it does ("Delete workspace"), not "OK". Destructive by default. */
export function AlertDialogAction({ variant = "destructive", ...props }: Omit<ButtonProps, "asChild">) {
  return (
    <DialogClose asChild>
      <Button variant={variant} {...props} />
    </DialogClose>
  );
}
