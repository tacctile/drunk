"use client";

import React from "react";

export type GlassIconButtonProps = {
  icon: string;
  ariaLabel: string;
  size?: "sm" | "md";
  onClick?: () => void;
  className?: string;
};

const sizeClasses = {
  sm: "w-tap-target-min h-tap-target-min",
  md: "w-[56px] h-[56px]",
} as const;

export function GlassIconButton({
  icon,
  ariaLabel,
  size = "sm",
  onClick,
  className = "",
}: GlassIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm shadow-lg border border-white/10 active:scale-95 transition-transform ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    >
      <span className="material-symbols-outlined text-white text-[24px]">
        {icon}
      </span>
    </button>
  );
}
