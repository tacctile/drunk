"use client";

import React from "react";

export type StatusPillProps = {
  icon?: string;
  label: string;
  iconClassName?: string;
  className?: string;
  size?: "sm" | "md";
  variant?: "default" | "active" | "muted" | "glass" | "primary";
  dot?: boolean;
  dotClassName?: string;
};

const sizeClasses = {
  sm: "px-2 py-0.5 gap-1",
  md: "px-3 py-1 gap-1.5",
} as const;

const variantClasses = {
  default: "bg-surface-variant/50 border border-outline-variant",
  active: "bg-secondary/10 text-secondary",
  muted: "bg-surface-variant text-on-surface-variant",
  glass: "bg-black/50 backdrop-blur-sm border border-white/10",
  primary: "bg-primary/10 border border-primary/30 text-primary",
} as const;

export function StatusPill({
  icon,
  label,
  iconClassName,
  className = "",
  size = "md",
  variant = "default",
  dot,
  dotClassName = "bg-error",
}: StatusPillProps) {
  const resolvedIconClassName =
    iconClassName ??
    (variant === "default"
      ? "text-secondary"
      : variant === "primary"
        ? "text-primary"
        : "");
  const labelColor =
    variant === "default"
      ? "text-on-surface"
      : variant === "glass"
        ? "text-white"
        : variant === "primary"
          ? "text-primary"
          : "";

  return (
    <div
      className={`flex items-center rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {dot && <span className={`w-2 h-2 rounded-full ${dotClassName}`} />}
      {icon && (
        <span
          className={`material-symbols-outlined ${resolvedIconClassName}`}
          style={{ fontSize: size === "sm" ? 14 : 16 }}
        >
          {icon}
        </span>
      )}
      <span
        className={`font-label-sm text-label-sm ${labelColor} ${variant === "glass" ? "uppercase tracking-widest" : ""}`}
      >
        {label}
      </span>
    </div>
  );
}
