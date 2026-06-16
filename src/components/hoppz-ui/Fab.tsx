"use client";

import React from "react";

export type FabProps = {
  icon: string;
  ariaLabel: string;
  filled?: boolean;
  onClick?: () => void;
  className?: string;
};

export function Fab({
  icon,
  ariaLabel,
  filled = true,
  onClick,
  className = "",
}: FabProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`fixed right-6 bottom-24 w-14 h-14 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.5)] border-t border-white/[0.07] active:scale-95 transition-all duration-150 z-40 ${className}`}
      onClick={onClick}
    >
      <span
        className="material-symbols-outlined"
        style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
    </button>
  );
}
