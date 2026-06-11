"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icon";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
}

/** Mobile-first bottom sheet for venue details and date breakdowns. */
export function BottomSheet({ open, onClose, children, label }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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
        className="anim-sheet w-full max-w-2xl rounded-t border-t border-line bg-surface px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-2 shadow-overlay"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded text-muted transition hover:bg-raised hover:text-ink"
          >
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="-mt-9">{children}</div>
      </div>
    </div>
  );
}
