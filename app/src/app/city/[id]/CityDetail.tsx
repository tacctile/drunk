"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { cityById } from "@/data/cities";
import { formatWalkDistance } from "@/lib/geo";
import { cityMeta } from "@/lib/score";
import { useVotes } from "@/hooks/useVotes";
import { CityMap } from "@/components/CityMap";
import { HotelCard } from "@/components/HotelCard";
import { Icon } from "@/components/Icon";
import { ScoreBadge, TierPill, VibePill } from "@/components/Pills";
import { VenueRow } from "@/components/VenueRow";
import { VenueSheet, findSheetVenue } from "@/components/VenueSheet";
import { VoteFlow } from "@/components/VoteFlow";

/** Full trip brief: hero, in-app map, vote, hotels, bars, food. */
export function CityDetail({ cityId }: { cityId: string }) {
  const city = cityById(cityId)!;
  const meta = cityMeta[city.id];
  const votes = useVotes();
  const tally = votes.ranking.find((t) => t.city.id === city.id);

  const [sheetId, setSheetId] = useState<string | null>(null);
  const [voteOpen, setVoteOpen] = useState(false);
  const mapAnchor = useRef<HTMLDivElement>(null);

  const openVenue = useCallback((id: string) => setSheetId(id), []);

  // List tap: pan the map to the pin (when it has one) and open the sheet.
  const focusFromList = (id: string) => {
    setSheetId(id);
    mapAnchor.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sheetVenue = findSheetVenue(city, sheetId);
  const votedHere = votes.myCityId === city.id;

  return (
    <div className="anim-fade flex flex-col gap-6">
      {/* Hero */}
      <section>
        <Link
          href="/cities"
          className="mb-2 inline-flex h-11 items-center gap-1 text-sm font-bold text-muted transition hover:text-ink"
        >
          <Icon name="arrow_back" size={18} />
          All cities
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {city.name}
              <span className="ml-2 text-lg font-bold text-faint">{city.state}</span>
            </h1>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-muted">
              <Icon name="route" size={16} />
              {city.miles} miles · {city.drive} from Ralston
            </p>
          </div>
          <ScoreBadge score={meta.score} size="lg" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <TierPill tier={meta.tier} />
          {city.vibes.map((v) => (
            <VibePill key={v} tag={v} />
          ))}
        </div>
        <p className="mt-2 text-xs font-semibold text-muted">
          {city.bars.length} bars · {city.food.length} food spots · {city.hotels.length} hotels
          {meta.nearestHotelMi !== null &&
            ` · closest hotel ${formatWalkDistance(meta.nearestHotelMi)} from the bar cluster`}
        </p>
      </section>

      {/* Map */}
      <section ref={mapAnchor} className="scroll-mt-20">
        <CityMap city={city} focusId={sheetId} onPinTap={openVenue} />
      </section>

      {/* Vote */}
      <section className="card flex items-center gap-3 p-4">
        <Icon
          name={votedHere ? "verified" : "how_to_vote"}
          size={26}
          className={votedHere ? "text-good" : "text-accent"}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold">
            {votedHere ? "Your vote lives here" : `Vote ${city.name} for the next trip`}
          </p>
          <p className="text-xs text-muted">
            {tally
              ? `${tally.count} vote${tally.count === 1 ? "" : "s"} — ${tally.voters
                  .map((v) => (v.isYou ? "You" : v.name))
                  .join(", ")}`
              : "No votes yet. Set the pace."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVoteOpen(true)}
          className={votedHere ? "btn-ghost" : "btn-accent"}
        >
          {votedHere ? "Change hotel" : "Vote"}
        </button>
      </section>

      {/* Hotels */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold">
          <Icon name="hotel" size={20} className="text-accent" />
          Hotels
        </h2>
        <div className="flex flex-col gap-3">
          {city.hotels.map((h) => (
            <HotelCard
              key={h.id}
              city={city}
              hotel={h}
              voteCount={tally?.hotelRanking.find((r) => r.hotel.id === h.id)?.count ?? 0}
            />
          ))}
        </div>
      </section>

      {/* Bars */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold">
          <Icon name="sports_bar" size={20} className="text-good" />
          Bars
          <span className="text-sm font-bold text-faint">{city.bars.length}</span>
        </h2>
        <div className="flex flex-col gap-2">
          {city.bars.map((b) => (
            <VenueRow key={b.id} venue={b} kind="bar" onTap={() => focusFromList(b.id)} />
          ))}
        </div>
      </section>

      {/* Food */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold">
          <Icon name="restaurant" size={20} className="text-food" />
          Food
          <span className="text-sm font-bold text-faint">{city.food.length}</span>
        </h2>
        <div className="flex flex-col gap-2">
          {city.food.map((f) => (
            <VenueRow key={f.id} venue={f} kind="food" onTap={() => focusFromList(f.id)} />
          ))}
        </div>
      </section>

      <VenueSheet city={city} venue={sheetVenue} onClose={() => setSheetId(null)} />
      <VoteFlow city={city} open={voteOpen} onClose={() => setVoteOpen(false)} />
    </div>
  );
}
