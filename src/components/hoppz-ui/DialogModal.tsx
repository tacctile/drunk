"use client";

import React from "react";

export type DialogModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function DialogModal({
  open,
  onClose,
  title,
  children,
  footer,
}: DialogModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-margin-mobile">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />
      <div className="relative w-full max-w-sm bg-surface-container-high rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="p-lg">
          <div className="flex items-center justify-between mb-xl">
            <h3 className="font-display-lg text-display-lg text-on-surface">
              {title}
            </h3>
            <button
              type="button"
              className="w-tap-target-min h-tap-target-min rounded-full hover:bg-white/5 flex items-center justify-center"
              onClick={onClose}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {children}
          {footer && <div className="mt-xl">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
