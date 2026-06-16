"use client";

import React from "react";

export type FloatingPillProps = {
  icon?: string;
  label: string;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "glass";
};

const variantClasses = {
  primary:
    "bg-primary-container text-white px-6 h-tap-target-min shadow-lg border border-white/10",
  glass:
    "bg-surface-dim/60 backdrop-blur-xl text-on-surface px-md py-sm shadow-2xl border border-white/10",
} as const;

export function FloatingPill({
  icon,
  label,
  onClick,
  className = "",
  variant = "primary",
}: FloatingPillProps) {
  return (
    <button
      type="button"
      className={`flex items-center gap-xs rounded-full active:scale-95 transition-all hover:opacity-90 ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {icon && <span className="material-symbols-outlined">{icon}</span>}
      <span className="font-title-md text-title-md">{label}</span>
    </button>
  );
}
