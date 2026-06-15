"use client";

import React from "react";

export type GhostButtonProps = {
  label: string;
  colorClassName?: string;
  onClick?: () => void;
};

export function GhostButton({
  label,
  colorClassName = "text-sky-blue",
  onClick,
}: GhostButtonProps) {
  return (
    <button
      type="button"
      className={`w-full min-h-tap-target-min py-sm bg-surface-variant/30 hover:bg-surface-variant/50 ${colorClassName} font-label-sm text-label-sm rounded-lg transition-colors active:scale-[0.98]`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
