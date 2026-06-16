"use client";

import React from "react";

export type PreferButtonProps = {
  preferred?: boolean;
  label?: string;
  preferredLabel?: string;
  onClick?: () => void;
};

export function PreferButton({
  preferred = false,
  label = "PREFER",
  preferredLabel = "PREFERRED",
  onClick,
}: PreferButtonProps) {
  const base =
    "mt-2 w-full h-[36px] rounded-lg font-label-sm text-label-sm flex items-center justify-center gap-sm active:scale-[0.98] transition-all";
  const cls = preferred
    ? `${base} bg-primary-container text-white`
    : `${base} border border-primary-container text-primary-container`;

  return (
    <button type="button" className={cls} onClick={onClick}>
      <span
        className="material-symbols-outlined text-[18px]"
        style={
          preferred
            ? { fontVariationSettings: "'FILL' 1" }
            : undefined
        }
      >
        favorite
      </span>
      {preferred ? preferredLabel : label}
    </button>
  );
}
