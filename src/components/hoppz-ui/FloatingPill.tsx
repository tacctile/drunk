"use client";

import React from "react";

export type FloatingPillProps = {
  icon?: string;
  iconClassName?: string;
  label: string;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "glass" | "sort";
};

const variantClasses = {
  primary:
    "bg-primary-container text-white px-6 h-tap-target-min shadow-lg border border-white/10",
  glass:
    "bg-surface-dim/60 backdrop-blur-xl text-on-surface px-md py-sm shadow-2xl border border-white/10",
  sort:
    "bg-surface-container-highest/95 backdrop-blur-xl border border-white/10 px-lg h-[44px] shadow-[0_4px_16px_rgba(0,0,0,0.5)]",
} as const;

const labelClasses = {
  primary: "font-title-md text-title-md",
  glass: "font-title-md text-title-md",
  sort: "font-label-sm text-label-sm text-on-surface",
} as const;

export function FloatingPill({
  icon,
  iconClassName,
  label,
  onClick,
  className = "",
  variant = "primary",
}: FloatingPillProps) {
  const defaultIconClass =
    variant === "sort" ? "text-primary text-[20px]" : "";
  return (
    <button
      type="button"
      className={`flex items-center gap-xs rounded-full active:scale-95 transition-all hover:opacity-90 ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {icon && (
        <span
          className={`material-symbols-outlined ${iconClassName ?? defaultIconClass}`}
        >
          {icon}
        </span>
      )}
      <span className={labelClasses[variant]}>{label}</span>
    </button>
  );
}
