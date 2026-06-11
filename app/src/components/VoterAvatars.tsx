import type { VoterTag } from "@/hooks/useVotes";

const MAX_VISIBLE = 5;

interface VoterAvatarsProps {
  voters: VoterTag[];
  size?: "sm" | "md";
}

/**
 * Vote counts as people: overlapping first-name initials, your own in accent.
 * Max five circles, then "+N". Deterministic collision rule: everyone gets one
 * letter; if two visible voters share it, those two show two letters.
 */
export function VoterAvatars({ voters, size = "md" }: VoterAvatarsProps) {
  if (voters.length === 0) return null;

  const sorted = [...voters].sort(
    (a, b) => a.name.localeCompare(b.name) || a.voterId.localeCompare(b.voterId),
  );
  const visible = sorted.slice(0, MAX_VISIBLE);
  const extra = sorted.length - visible.length;

  const firstLetterCounts = new Map<string, number>();
  for (const v of visible) {
    const letter = (v.name[0] ?? "?").toUpperCase();
    firstLetterCounts.set(letter, (firstLetterCounts.get(letter) ?? 0) + 1);
  }
  const initialFor = (name: string) => {
    const letter = (name[0] ?? "?").toUpperCase();
    if ((firstLetterCounts.get(letter) ?? 0) > 1 && name.length > 1) {
      return letter + name[1].toLowerCase();
    }
    return letter;
  };

  const circle = size === "md" ? "h-7 w-7" : "h-6 w-6";

  return (
    <span
      role="img"
      aria-label={`Votes from ${sorted.map((v) => (v.isYou ? "you" : v.name)).join(", ")}`}
      className="inline-flex items-center"
    >
      {visible.map((v, i) => (
        <span
          key={v.voterId}
          className={`flex ${circle} items-center justify-center rounded-full text-xs font-semibold ring-2 ring-bg ${
            v.isYou ? "bg-accent text-accent-ink" : "bg-raised text-ink"
          } ${i > 0 ? "-ml-1.5" : ""}`}
        >
          {initialFor(v.name)}
        </span>
      ))}
      {extra > 0 && (
        <span className="ml-1.5 text-xs font-semibold tabular-nums text-muted">+{extra}</span>
      )}
    </span>
  );
}
