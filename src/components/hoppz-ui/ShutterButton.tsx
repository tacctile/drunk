"use client";

import React from "react";

export type ShutterButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ShutterButton({
  onClick,
  disabled = false,
  className = "",
}: ShutterButtonProps) {
  return (
    <button
      type="button"
      aria-label="Capture photo"
      disabled={disabled}
      className={`relative flex items-center justify-center w-[72px] h-[72px] active:scale-95 transition-transform disabled:opacity-50 ${className}`}
      onClick={onClick}
    >
      <div className="absolute inset-0 border-[4px] border-black/40 rounded-full" />
      <div className="w-full h-full bg-white rounded-full shadow-lg active:scale-90 transition-transform" />
    </button>
  );
}
