"use client";

import React from "react";

export type BottomNavItemProps = {
  icon: string;
  label?: string;
  active?: boolean;
  filled?: boolean;
  activeColor?: string;
  fill?: boolean;
  onClick?: () => void;
};

export function BottomNavItem({
  icon,
  label,
  active = false,
  filled = false,
  activeColor = "text-primary",
  fill = false,
  onClick,
}: BottomNavItemProps) {
  const color = active ? activeColor : "text-on-surface-variant";
  const fillClass = fill ? "flex-1 h-full" : "min-w-tap-target-min min-h-tap-target-min";

  return (
    <button
      type="button"
      className={`flex flex-col items-center justify-center ${fillClass} ${color} hover:bg-surface-variant/50 transition-all duration-150 active:scale-95`}
      onClick={onClick}
    >
      <span
        className="material-symbols-outlined mb-0.5"
        style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
      {label && (
        <span
          className={`font-label-sm text-label-sm ${active ? "font-bold" : ""}`}
        >
          {label}
        </span>
      )}
    </button>
  );
}
