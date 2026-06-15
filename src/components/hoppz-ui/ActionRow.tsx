"use client";

import React from "react";

export type ActionRowProps = {
  icon: string;
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger";
};

const variantClasses = {
  default: "text-on-surface",
  danger: "text-[#EF4444]",
} as const;

export function ActionRow({
  icon,
  label,
  onClick,
  variant = "default",
}: ActionRowProps) {
  return (
    <button
      type="button"
      className="w-full flex items-center space-x-md py-md px-1 active:opacity-70 transition-opacity"
      onClick={onClick}
    >
      <span className={`material-symbols-outlined ${variantClasses[variant]}`}>
        {icon}
      </span>
      <span className={`font-body-md text-body-md ${variantClasses[variant]}`}>
        {label}
      </span>
    </button>
  );
}
