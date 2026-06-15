"use client";

import React from "react";

export type BottomNavItemProps = {
  icon: string;
  label?: string;
  active?: boolean;
  filled?: boolean;
  activeColor?: string;
  onClick?: () => void;
};

export function BottomNavItem({
  icon,
  label,
  active = false,
  filled = false,
  activeColor = "text-primary",
  onClick,
}: BottomNavItemProps) {
  const color = active ? activeColor : "text-on-surface-variant";

  return (
    <button
      type="button"
      className={`flex flex-col items-center justify-center min-w-tap-target-min min-h-tap-target-min ${color} hover:bg-surface-variant/50 transition-all`}
      onClick={onClick}
    >
      <span
        className="material-symbols-outlined"
        style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
      {label && (
        <span
          className={`font-label-sm text-[10px] mt-0.5 ${active ? "font-bold" : ""}`}
        >
          {label}
        </span>
      )}
    </button>
  );
}
