"use client";

import React from "react";

export type BottomNavItemProps = {
  icon: string;
  label?: string;
  active?: boolean;
  filled?: boolean;
  onClick?: () => void;
};

export function BottomNavItem({
  icon,
  label,
  active = false,
  filled = false,
  onClick,
}: BottomNavItemProps) {
  return (
    <button
      type="button"
      className={`flex flex-col items-center justify-center min-w-tap-target-min min-h-tap-target-min ${
        active ? "text-primary" : "text-on-surface-variant"
      }`}
      onClick={onClick}
    >
      <span
        className="material-symbols-outlined"
        style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
      {label && (
        <span className="font-label-sm text-[10px] mt-0.5">{label}</span>
      )}
    </button>
  );
}
