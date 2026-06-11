import Link from "next/link";
import type { City } from "@/data/types";
import { cityMeta } from "@/lib/score";
import { formatShortDate } from "@/lib/format";
import { Icon } from "./Icon";
import { ScoreBadge, TierPill, VibePill } from "./Pills";

interface CityCardProps {
  city: City;
  votes: number;
  bestDate: string | null;
}

export function CityCard({ city, votes, bestDate }: CityCardProps) {
  const meta = cityMeta[city.id];
  return (
    <Link
      href={`/city/${city.id}`}
      className="card block p-4 transition hover:border-line-strong hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-extrabold tracking-tight">
            {city.name}
            <span className="ml-1.5 text-sm font-bold text-faint">{city.state}</span>
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-muted">
            <Icon name="route" size={14} />
            {city.miles} mi · {city.drive} from Ralston
          </p>
        </div>
        <ScoreBadge score={meta.score} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <TierPill tier={meta.tier} />
        {city.vibes.map((v) => (
          <VibePill key={v} tag={v} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted">
        <span className="inline-flex items-center gap-1">
          <Icon name="sports_bar" size={15} className="text-good" />
          {city.bars.length} bars
        </span>
        <span className="inline-flex items-center gap-1">
          <Icon name="how_to_vote" size={15} className={votes > 0 ? "text-accent" : ""} />
          {votes === 0 ? "No votes yet" : `${votes} vote${votes === 1 ? "" : "s"}`}
        </span>
        {bestDate && (
          <span className="inline-flex items-center gap-1">
            <Icon name="event_available" size={15} className="text-good" />
            Best: {formatShortDate(bestDate)}
          </span>
        )}
      </div>
    </Link>
  );
}
