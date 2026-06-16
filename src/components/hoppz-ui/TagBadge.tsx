"use client";

import React from "react";

export type TagBadgeVariant = "secondary" | "primary" | "tertiary";

export type TagBadgeProps = {
  label: string;
  variant?: TagBadgeVariant;
  className?: string;
};

const variantClasses: Record<TagBadgeVariant, string> = {
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  primary: "bg-primary/10 text-primary border-primary/20",
  tertiary: "bg-tertiary/10 text-tertiary border-tertiary/20",
};

export function TagBadge({
  label,
  variant = "secondary",
  className = "",
}: TagBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-tight ${variantClasses[variant]} ${className}`}
    >
      {label}
    </span>
  );
}
