import type { VibeTag, WalkabilityTier } from "@/data/types";
import { Icon } from "./Icon";

const TIER_ICON: Record<WalkabilityTier, string> = {
  "Walk Everything": "directions_walk",
  "Walk Most": "directions_walk",
  "Need a Ride": "local_taxi",
};

export function TierPill({ tier }: { tier: WalkabilityTier }) {
  const tone =
    tier === "Walk Everything"
      ? "bg-good-soft text-good"
      : tier === "Walk Most"
        ? "bg-accent-soft text-accent"
        : "bg-surface-2 text-muted";
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-2xs font-extrabold uppercase tracking-wide ${tone}`}
    >
      <Icon name={TIER_ICON[tier]} size={14} />
      {tier}
    </span>
  );
}

export function VibePill({ tag }: { tag: VibeTag }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full border border-line px-2 text-2xs font-bold text-muted">
      {tag}
    </span>
  );
}

/** Composite 0–100 score badge. */
export function ScoreBadge({ score, size = "md" }: { score: number; size?: "md" | "lg" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-accent-soft font-extrabold tabular-nums text-accent ${
        size === "lg" ? "h-12 w-12 text-lg" : "h-9 w-9 text-sm"
      }`}
      title={`Composite score ${score} / 100`}
    >
      {score}
    </span>
  );
}

/** Marks venues whose details couldn't be verified during research. */
export function UnverifiedFlag({ note }: { note?: string }) {
  return (
    <span
      className="inline-flex h-5 items-center gap-0.5 rounded-full bg-surface-2 px-1.5 text-2xs font-bold text-faint"
      title={note ? `Unverified — ${note}` : "Address not yet verified"}
    >
      <Icon name="help" size={12} />
      unverified
    </span>
  );
}

export function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-px text-accent" aria-label={`${count} stars`}>
      {Array.from({ length: count }, (_, i) => (
        <Icon key={i} name="star" filled size={13} />
      ))}
    </span>
  );
}
