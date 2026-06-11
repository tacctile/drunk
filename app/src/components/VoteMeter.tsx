interface VoteMeterProps {
  count: number;
  max: number;
  tone?: "accent" | "muted";
}

/** Horizontal vote bar; width is share of the leading tally. */
export function VoteMeter({ count, max, tone = "accent" }: VoteMeterProps) {
  const pct = max > 0 ? Math.max(6, Math.round((count / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2" role="presentation">
      <div
        className={`h-full rounded-full transition-[width] ${tone === "accent" ? "bg-accent" : "bg-line-strong"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
