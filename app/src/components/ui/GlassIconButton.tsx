"use client";

import { Icon } from "@/components/Icon";

interface GlassIconButtonProps {
  icon: string;
  iconSize?: number;
  label?: string;
  onClick?: () => void;
  ariaLabel: string;
  className?: string;
}

export function GlassIconButton({
  icon,
  iconSize = 24,
  label,
  onClick,
  ariaLabel,
  className = "",
}: GlassIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex flex-col items-center gap-1 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 shadow-lg backdrop-blur-md transition-transform active:scale-95">
        <Icon name={icon} size={iconSize} className="text-white" />
      </div>
      {label && (
        <span className="text-[12px] font-semibold text-white drop-shadow-md">
          {label}
        </span>
      )}
    </button>
  );
}
