"use client";

import type { ReactNode } from "react";
import { DialogModal } from "@hoppz-ui";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  return (
    <DialogModal open={open} onClose={onClose} title={title}>
      {children}
    </DialogModal>
  );
}
