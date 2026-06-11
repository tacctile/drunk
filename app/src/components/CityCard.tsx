import Link from "next/link";
import type { City } from "@/data/types";
import type { VoterTag } from "@/hooks/useVotes";
import { VoterAvatars } from "./VoterAvatars";
import { WalkStrip } from "./WalkStrip";

interface CityCardProps {
  city: City;
  voters: VoterTag[];
  /** One-shot pulse when another voter just moved this city's tally. */
  pulse?: boolean;
}

/**
 * Exactly five elements, in order: name + state, tagline, walk strip,
 * drive time, vote initials. The whole card is the link.
 */
export function CityCard({ city, voters, pulse = false }: CityCardProps) {
  return (
    <Link
      href={`/city/${city.id}`}
      className={`card block p-5 transition hover:border-line-strong ${pulse ? "anim-pulse-once" : ""}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 truncate text-display tracking-tight">{city.name}</h3>
        <span className="label flex-none">{city.state}</span>
      </div>
      <p className="mt-1 truncate text-base text-muted">{city.tagline}</p>
      <div className="mt-4">
        <WalkStrip city={city} />
      </div>
      <p className="label mt-3 tabular-nums">{city.drive}</p>
      {voters.length > 0 && (
        <div className="mt-3">
          <VoterAvatars voters={voters} />
        </div>
      )}
    </Link>
  );
}
