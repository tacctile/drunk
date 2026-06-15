"use client";

import React from "react";
import { ToggleSwitch } from "./ToggleSwitch";

export type SettingsToggleRowProps = {
  icon: string;
  title: string;
  description?: string;
  iconBgClassName?: string;
  iconClassName?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
};

export function SettingsToggleRow({
  icon,
  title,
  description,
  iconBgClassName = "bg-primary/10",
  iconClassName = "text-primary",
  checked = false,
  onChange,
  disabled = false,
}: SettingsToggleRowProps) {
  return (
    <div
      className={`flex items-center justify-between min-h-tap-target-min ${disabled ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-md">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBgClassName} ${iconClassName}`}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <p className="font-title-md text-title-md text-white">{title}</p>
          {description && (
            <p className="text-meta-xs text-on-surface-variant">
              {description}
            </p>
          )}
        </div>
      </div>
      <ToggleSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        ariaLabel={title}
      />
    </div>
  );
}
