"use client";

import React, { useEffect } from "react";

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[32px] px-margin-mobile pt-4 pb-12 shadow-[0_-4px_16px_rgba(0,0,0,0.5)] bg-[rgba(41,42,45,0.6)] backdrop-blur-[12px] border-t border-white/[0.07]"
        role="dialog"
        aria-modal="true"
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.4s cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      >
        <div className="w-12 h-1.5 bg-surface-variant rounded-full mx-auto mb-lg" />
        {children}
      </div>
    </>
  );
}
