"use client";

import React from "react";

export type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  actionClassName?: string;
  onAction?: () => void;
};

export function SectionHeader({
  title,
  actionLabel,
  actionClassName = "text-sky-blue",
  onAction,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-title-md text-title-md text-on-surface">{title}</h3>
      {actionLabel && (
        <button
          type="button"
          className={`font-label-sm text-label-sm min-h-tap-target-min flex items-center ${actionClassName}`}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
