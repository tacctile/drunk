"use client";

import React from "react";

export type StatusPillProps = {
  icon?: string;
  label: string;
  iconClassName?: string;
  className?: string;
};

export function StatusPill({
  icon,
  label,
  iconClassName = "text-secondary",
  className = "",
}: StatusPillProps) {
  return (
    <div
      className={`flex items-center bg-surface-variant/50 px-3 py-1 rounded-full border border-outline-variant ${className}`}
    >
      {icon && (
        <span
          className={`material-symbols-outlined mr-1.5 ${iconClassName}`}
          style={{ fontSize: 16 }}
        >
          {icon}
        </span>
      )}
      <span className="font-label-sm text-label-sm text-on-surface">
        {label}
      </span>
    </div>
  );
}
