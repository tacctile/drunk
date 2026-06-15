"use client";

import React from "react";

export type LinkRowProps = {
  label: string;
  onClick?: () => void;
};

export function LinkRow({ label, onClick }: LinkRowProps) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-between py-4 border-b border-white/5 active:bg-white/5 transition-colors"
      onClick={onClick}
    >
      <span className="font-body-md text-body-md text-on-surface">{label}</span>
      <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
        chevron_right
      </span>
    </button>
  );
}
