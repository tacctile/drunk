"use client";

import React, { useState } from "react";

export type PinInputProps = {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  hint?: string;
};

export function PinInput({
  value,
  onChange,
  maxLength = 2,
  placeholder = "••",
  hint,
}: PinInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-md">
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg h-12 px-md text-center font-title-md tracking-[0.5em] focus:outline-none focus:border-primary transition-colors text-on-surface"
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide PIN" : "Show PIN"}
        >
          <span className="material-symbols-outlined text-[20px]">
            {visible ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
      {hint && (
        <p className="font-meta-xs text-meta-xs text-on-surface-variant text-center">
          {hint}
        </p>
      )}
    </div>
  );
}
