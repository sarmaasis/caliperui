"use client";

import { DialogContent, type DialogContentProps } from "./dialog";
import { cn } from "./lib/cn";

export {
  Dialog as Drawer,
  DialogTrigger as DrawerTrigger,
  DialogClose as DrawerClose,
  DialogTitle as DrawerTitle,
  DialogDescription as DrawerDescription,
  DialogHeader as DrawerHeader,
  DialogFooter as DrawerFooter,
} from "./dialog";

export type DrawerContentProps = DialogContentProps & {
  side?: "left" | "right";
};

export function DrawerContent({
  side = "right",
  className,
  ...props
}: DrawerContentProps) {
  return (
    <DialogContent
      data-motion="sheet"
      data-side={side}
      className={cn(
        "top-0 flex h-dvh max-h-dvh w-[calc(100%-1rem)] max-w-md translate-x-0 translate-y-0 flex-col rounded-none",
        side === "right"
          ? "right-0 left-auto border-y-0 border-r-0"
          : "left-0 border-y-0 border-l-0",
        className,
      )}
      {...props}
    />
  );
}
