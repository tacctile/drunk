"use client";

import React from "react";

export type FloatingActionVariant = "solid" | "glass";

export type FloatingActionProps = {
  icon?: string;
  label: string;
  onClick?: () => void;
  visible?: boolean;
  toggled?: boolean;
  iconFilled?: boolean;
  variant?: FloatingActionVariant;
};

export function FloatingAction({
  icon,
  label,
  onClick,
  visible = true,
  toggled = false,
  iconFilled = false,
  variant = "solid",
}: FloatingActionProps) {
  if (!visible) return null;

  const solidBase = "bg-secondary text-on-secondary border-t border-white/[0.07]";
  const glassDefault = "border border-primary-container text-primary-container bg-surface/80 backdrop-blur-md";
  const glassToggled = "bg-primary-container text-on-primary-container";

  let buttonClass: string;
  if (variant === "glass") {
    buttonClass = toggled ? glassToggled : glassDefault;
  } else {
    buttonClass = solidBase;
  }

  return (
    <div className="fixed bottom-24 left-0 right-0 p-margin-mobile z-40 pointer-events-none">
      <button
        type="button"
        className={`pointer-events-auto w-full h-[56px] font-title-md text-title-md rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex items-center justify-center gap-md active:scale-95 transition-all duration-300 ${buttonClass}`}
        onClick={onClick}
      >
        {icon && (
          <span
            className="material-symbols-outlined"
            style={
              iconFilled || toggled
                ? { fontVariationSettings: "'FILL' 1" }
                : undefined
            }
          >
            {icon}
          </span>
        )}
        <span>{label}</span>
      </button>
    </div>
  );
}
