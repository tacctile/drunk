"use client";

import React from "react";

export type FloatingActionProps = {
  icon?: string;
  label: string;
  onClick?: () => void;
  visible?: boolean;
};

export function FloatingAction({
  icon,
  label,
  onClick,
  visible = true,
}: FloatingActionProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 p-margin-mobile z-40">
      <button
        type="button"
        className="w-full h-tap-target-min bg-secondary text-on-secondary font-title-md text-title-md rounded-xl border-t border-white/[0.07] shadow-lg flex items-center justify-center space-x-sm active:scale-95 transition-all"
        onClick={onClick}
      >
        {icon && <span className="material-symbols-outlined">{icon}</span>}
        <span>{label}</span>
      </button>
    </div>
  );
}
