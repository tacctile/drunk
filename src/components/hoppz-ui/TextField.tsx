"use client";

import React from "react";

export type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  type?: string;
  placeholder?: string;
};

export function TextField({
  label,
  value,
  onChange,
  maxLength,
  type = "text",
  placeholder,
}: TextFieldProps) {
  return (
    <div className="space-y-xs">
      <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">
        {label}
      </label>
      <input
        type={type}
        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg h-12 px-md font-body-md focus:outline-none focus:border-primary transition-colors text-on-surface"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
      />
    </div>
  );
}
