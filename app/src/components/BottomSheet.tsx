"use client";

import type { ReactNode } from "react";
import { BottomSheet as HoppzBottomSheet } from "@hoppz-ui";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
}

export function BottomSheet({ open, onClose, children, label }: BottomSheetProps) {
  return (
    <HoppzBottomSheet open={open} onClose={onClose}>
      <div aria-label={label}>
        {children}
      </div>
    </HoppzBottomSheet>
  );
}
