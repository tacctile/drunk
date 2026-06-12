"use client";

import { useEffect, type ReactNode } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
}

/** Slide-up sheet for sort options, venue details, and date breakdowns. */
export function BottomSheet({ open, onClose, children, label }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    lockBodyScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockBodyScroll();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-black/45"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="anim-sheet max-h-[80dvh] w-full max-w-2xl overflow-y-auto rounded-t-card border-t bg-surface px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-2 shadow-overlay"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />
        {children}
      </div>
    </div>
  );
}
