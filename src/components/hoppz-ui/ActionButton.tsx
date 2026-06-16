"use client";

import React from "react";

export type ActionButtonProps = {
  label: string;
  icon?: string;
  variant?: "filled" | "ghost" | "glow";
  iconPosition?: "leading" | "trailing";
  fullWidth?: boolean;
  onClick?: () => void;
};

const variantStyles = {
  filled: "bg-primary-container text-white rounded-xl",
  ghost: "bg-surface-variant text-on-surface rounded-xl",
  glow: "bg-primary-container text-white rounded-full shadow-[0_4px_24px_rgba(14,165,233,0.5)] border border-white/20",
} as const;

export function ActionButton({
  label,
  icon,
  variant = "filled",
  iconPosition = "leading",
  fullWidth = false,
  onClick,
}: ActionButtonProps) {
  const widthClass = fullWidth ? "w-full max-w-sm" : "flex-1";

  return (
    <button
      type="button"
      className={`min-h-tap-target-min font-title-md text-title-md active:scale-[0.98] transition-all flex items-center justify-center gap-sm ${widthClass} ${variantStyles[variant]}`}
      onClick={onClick}
    >
      {icon && iconPosition === "leading" && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
      {label}
      {icon && iconPosition === "trailing" && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
    </button>
  );
}
