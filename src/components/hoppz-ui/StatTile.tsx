"use client";

import React from "react";

export type StatTileProps = {
  icon: string;
  iconClassName?: string;
  value: string;
  label: string;
  className?: string;
};

export function StatTile({
  icon,
  iconClassName = "text-primary",
  value,
  label,
  className = "",
}: StatTileProps) {
  return (
    <div
      className={`flex-shrink-0 w-32 p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1 ${className}`}
    >
      <span className={`material-symbols-outlined ${iconClassName}`}>
        {icon}
      </span>
      <p className="font-display-lg text-[20px] text-on-surface">{value}</p>
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </p>
    </div>
  );
}
