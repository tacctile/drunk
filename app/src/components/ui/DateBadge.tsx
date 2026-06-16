const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface DateBadgeProps {
  dateKey: string;
  variant?: "primary" | "muted";
}

export function DateBadge({ dateKey, variant = "primary" }: DateBadgeProps) {
  const [, m, d] = dateKey.split("-").map(Number);
  const month = MONTHS[m - 1];
  const isPrimary = variant === "primary";
  return (
    <div
      className={`flex h-10 w-10 flex-none flex-col items-center justify-center rounded-btn border ${
        isPrimary
          ? "border-green bg-green-dim"
          : "border-border bg-raised"
      }`}
    >
      <span
        className={`text-[10px] font-bold uppercase leading-none ${
          isPrimary ? "text-green" : "text-ink-muted"
        }`}
      >
        {month}
      </span>
      <span className="text-sm font-extrabold leading-tight text-ink">
        {d}
      </span>
    </div>
  );
}
