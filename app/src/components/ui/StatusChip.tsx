import { Icon } from "@/components/Icon";

interface StatusChipProps {
  label: string;
  variant?: "active" | "muted";
  icon?: string;
}

export function StatusChip({ label, variant = "muted", icon }: StatusChipProps) {
  const isActive = variant === "active";

  return (
    <span
      className={`inline-flex flex-none items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${
        isActive ? "bg-green-dim text-green" : "bg-raised text-ink-muted"
      }`}
    >
      {icon && <Icon name={icon} size={14} />}
      {label}
    </span>
  );
}
