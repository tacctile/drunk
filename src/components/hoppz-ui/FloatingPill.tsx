"use client";

import React from "react";

export type FloatingPillProps = {
  icon?: string;
  label: string;
  onClick?: () => void;
  className?: string;
};

export function FloatingPill({
  icon,
  label,
  onClick,
  className = "",
}: FloatingPillProps) {
  return (
    <button
      type="button"
      className={`flex items-center gap-sm bg-primary-container text-white px-6 h-tap-target-min rounded-full shadow-lg border border-white/10 active:scale-95 transition-all hover:opacity-90 ${className}`}
      onClick={onClick}
    >
      {icon && <span className="material-symbols-outlined">{icon}</span>}
      <span className="font-title-md text-title-md">{label}</span>
    </button>
  );
}
