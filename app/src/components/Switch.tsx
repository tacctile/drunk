"use client";

interface SwitchProps {
  checked: boolean;
  onToggle: () => void;
  ariaLabel: string;
  disabled?: boolean;
}

export function Switch({ checked, onToggle, ariaLabel, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onToggle}
      className="flex h-11 w-11 flex-none items-center justify-center disabled:opacity-50"
    >
      <span
        className={`relative h-6 w-10 rounded-full border transition ${
          checked ? "border-accent bg-accent" : "border-border-strong bg-raised"
        }`}
      >
        <span
          className={`absolute left-[2px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full transition ${
            checked ? "translate-x-4 bg-bg" : "bg-ink-muted"
          }`}
        />
      </span>
    </button>
  );
}
