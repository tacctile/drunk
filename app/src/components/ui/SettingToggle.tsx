"use client";

import { Icon } from "@/components/Icon";
import { Switch } from "@/components/Switch";

interface SettingToggleProps {
  icon: string;
  iconClassName?: string;
  iconBgClassName?: string;
  title: string;
  subtitle?: string;
  checked: boolean;
  disabled?: boolean;
  dimmed?: boolean;
  onToggle: () => void;
  ariaLabel: string;
}

export function SettingToggle({
  icon,
  iconClassName = "text-ink-muted",
  iconBgClassName = "bg-raised",
  title,
  subtitle,
  checked,
  disabled = false,
  dimmed = false,
  onToggle,
  ariaLabel,
}: SettingToggleProps) {
  return (
    <div
      className={`flex items-center justify-between ${dimmed ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${iconBgClassName}`}
        >
          <Icon name={icon} size={20} className={iconClassName} />
        </div>
        <div>
          <p className="text-base font-bold text-ink">{title}</p>
          {subtitle && (
            <p className="text-meta font-normal text-ink-muted">{subtitle}</p>
          )}
        </div>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onToggle={onToggle}
        ariaLabel={ariaLabel}
      />
    </div>
  );
}
