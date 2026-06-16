"use client";

import React from "react";

export type QuickActionCardProps = {
  icon: string;
  iconClassName?: string;
  label: string;
  onClick?: () => void;
  className?: string;
};

export function QuickActionCard({
  icon,
  iconClassName = "text-primary",
  label,
  onClick,
  className = "",
}: QuickActionCardProps) {
  return (
    <button
      type="button"
      className={`flex flex-col items-start justify-between p-4 bg-surface-container min-h-[128px] rounded-xl border-t border-white/[0.07] shadow-sm active:scale-95 transition-transform ${className}`}
      onClick={onClick}
    >
      <span
        className={`material-symbols-outlined ${iconClassName}`}
        style={{ fontSize: 32 }}
      >
        {icon}
      </span>
      <p className="font-title-md text-title-md text-on-surface text-left">
        {label}
      </p>
    </button>
  );
}
