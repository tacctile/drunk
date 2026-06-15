"use client";

import React from "react";

export type MapPinProps = {
  label: string;
  color?: string;
  glowColor?: string;
  animated?: boolean;
  onClick?: () => void;
};

export function MapPin({
  label,
  color = "bg-primary",
  glowColor,
  animated = true,
  onClick,
}: MapPinProps) {
  return (
    <button
      type="button"
      className="flex flex-col items-center min-w-tap-target-min min-h-tap-target-min justify-center"
      onClick={onClick}
    >
      <div className="bg-surface-container-highest px-sm py-1 rounded-full mb-xs border border-white/10 shadow-lg">
        <span className="font-label-sm text-label-sm text-white">{label}</span>
      </div>
      <div
        className={`w-3 h-3 ${color} border-2 border-white rounded-full ${animated ? "animate-pulse" : ""}`}
        style={glowColor ? { boxShadow: `0 0 12px ${glowColor}` } : undefined}
      />
    </button>
  );
}
