"use client";

import React from "react";

export type MapPinVariant = "dot" | "icon";

export type MapPinProps = {
  label: string;
  color?: string;
  glowColor?: string;
  animated?: boolean;
  variant?: MapPinVariant;
  labelClassName?: string;
  labelTextClassName?: string;
  iconClassName?: string;
  onClick?: () => void;
};

export function MapPin({
  label,
  color = "bg-primary",
  glowColor,
  animated = true,
  variant = "dot",
  labelClassName,
  labelTextClassName,
  iconClassName,
  onClick,
}: MapPinProps) {
  const defaultLabelCls = "bg-surface-container-highest border border-white/10";
  const defaultTextCls = "text-white";

  return (
    <button
      type="button"
      className="flex flex-col items-center min-w-tap-target-min min-h-tap-target-min justify-center"
      onClick={onClick}
    >
      <div
        className={`px-3 py-1 rounded-full mb-xs shadow-lg ${labelClassName ?? defaultLabelCls}`}
      >
        <span
          className={`font-bold text-[10px] leading-none ${labelTextClassName ?? defaultTextCls}`}
        >
          {label}
        </span>
      </div>
      {variant === "icon" ? (
        <span
          className={`material-symbols-outlined ${iconClassName ?? color.replace("bg-", "text-")}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          location_on
        </span>
      ) : (
        <div
          className={`w-3 h-3 ${color} border-2 border-white rounded-full ${animated ? "animate-pulse" : ""}`}
          style={glowColor ? { boxShadow: `0 0 12px ${glowColor}` } : undefined}
        />
      )}
    </button>
  );
}
