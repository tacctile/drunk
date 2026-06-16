"use client";

import React from "react";

export type ActionButtonProps = {
  label: string;
  icon?: string;
  variant?: "filled" | "ghost";
  onClick?: () => void;
};

export function ActionButton({
  label,
  icon,
  variant = "filled",
  onClick,
}: ActionButtonProps) {
  const variantClasses =
    variant === "filled"
      ? "bg-primary-container text-white"
      : "bg-surface-variant text-on-surface";

  return (
    <button
      type="button"
      className={`flex-1 min-h-tap-target-min rounded-xl font-title-md text-title-md active:scale-95 transition-transform flex items-center justify-center gap-2 ${variantClasses}`}
      onClick={onClick}
    >
      {icon && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
      {label}
    </button>
  );
}
