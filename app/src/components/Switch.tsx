"use client";

import { ToggleSwitch } from "@hoppz-ui";

interface SwitchProps {
  checked: boolean;
  onToggle: () => void;
  ariaLabel: string;
  disabled?: boolean;
}

export function Switch({ checked, onToggle, ariaLabel, disabled = false }: SwitchProps) {
  return (
    <ToggleSwitch
      checked={checked}
      onChange={() => onToggle()}
      ariaLabel={ariaLabel}
      disabled={disabled}
    />
  );
}
