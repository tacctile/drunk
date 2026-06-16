"use client";

import { Icon } from "@/components/Icon";

interface FloatingActionButtonProps {
  icon: string;
  onClick?: () => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

export function FloatingActionButton({
  icon,
  onClick,
  ariaLabel,
  disabled = false,
  className = "",
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`flex h-14 w-14 items-center justify-center rounded-full bg-green shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all duration-150 active:scale-95 disabled:opacity-50 ${className}`}
      style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
    >
      <Icon name={icon} filled size={24} className="text-bg" />
    </button>
  );
}
