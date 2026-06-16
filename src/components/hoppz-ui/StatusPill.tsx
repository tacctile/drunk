"use client";

import React from "react";

export type StatusPillProps = {
  icon?: string;
  label: string;
  iconClassName?: string;
  className?: string;
  size?: "sm" | "md";
  variant?: "default" | "active" | "muted";
};

const sizeClasses = {
  sm: "px-2 py-0.5 gap-1",
  md: "px-3 py-1 gap-1.5",
} as const;

const variantClasses = {
  default: "bg-surface-variant/50 border border-outline-variant",
  active: "bg-secondary/10 text-secondary",
  muted: "bg-surface-variant text-on-surface-variant",
} as const;

export function StatusPill({
  icon,
  label,
  iconClassName,
  className = "",
  size = "md",
  variant = "default",
}: StatusPillProps) {
  const resolvedIconClassName =
    iconClassName ?? (variant === "default" ? "text-secondary" : "");
  const labelColor = variant === "default" ? "text-on-surface" : "";

  return (
    <div
      className={`flex items-center rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {icon && (
        <span
          className={`material-symbols-outlined ${resolvedIconClassName}`}
          style={{ fontSize: size === "sm" ? 14 : 16 }}
        >
          {icon}
        </span>
      )}
      <span className={`font-label-sm text-label-sm ${labelColor}`}>
        {label}
      </span>
    </div>
  );
}
