interface ProgressBarProps {
  percent: number;
  colorClassName?: string;
}

export function ProgressBar({
  percent,
  colorClassName = "bg-accent",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-raised">
      <div
        className={`h-full rounded-full transition-all ${colorClassName}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
