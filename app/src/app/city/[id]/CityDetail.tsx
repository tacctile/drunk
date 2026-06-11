"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { cities, cityById } from "@/data/cities";
import { useVotes } from "@/hooks/useVotes";
import { CityMap } from "@/components/CityMap";
import { ConstellationMap } from "@/components/ConstellationMap";
import { HotelCard } from "@/components/HotelCard";
import { Icon } from "@/components/Icon";
import { VenueRow } from "@/components/VenueRow";
import { VenueSheet, findSheetVenue } from "@/components/VenueSheet";
import { VoterAvatars } from "@/components/VoterAvatars";
import { WalkStrip } from "@/components/WalkStrip";

/**
 * The full trip brief. Mobile is a single column; >= 840px adds a persistent
 * cities list on the left. The map starts as the SVG constellation peek and
 * only mounts the live Google map once expanded.
 */
export function CityDetail({ cityId }: { cityId: string }) {
  const city = cityById(cityId)!;
  const votes = useVotes();
  const tally = votes.ranking.find((t) => t.city.id === city.id);

  const [sheetId, setSheetId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const mapAnchor = useRef<HTMLDivElement>(null);

  // Pin tap: open the in-app sheet (and keep that pin spotlit).
  const onPinTap = useCallback((id: string) => {
    setFocusId(id);
    setSheetId(id);
  }, []);

  // List tap: expand the map and pan to the venue's pin.
  const focusFromList = (id: string) => {
    setFocusId(id);
    setMapOpen(true);
    mapAnchor.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sheetVenue = findSheetVenue(city, sheetId);
  const votedHere = votes.myCityId === city.id;
  const myHotel =
    votedHere && votes.myHotelId
      ? city.hotels.find((h) => h.id === votes.myHotelId) ?? null
      : null;

  const sidebarCities = [...cities].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="anim-fade min-[840px]:grid min-[840px]:grid-cols-[240px_1fr] min-[840px]:items-start min-[840px]:gap-8">
      {/* Persistent cities list — desktop two-pane only */}
      <aside className="sticky top-8 hidden max-h-[calc(100dvh-96px)] flex-col gap-0.5 overflow-y-auto pr-1 min-[840px]:flex">
        <p className="label mb-2 px-3">Cities</p>
        {sidebarCities.map((c) => {
          const current = c.id === city.id;
          return (
            <Link
              key={c.id}
              href={`/city/${c.id}`}
              aria-current={current ? "page" : undefined}
              className={`flex h-11 flex-none items-center justify-between gap-2 rounded px-3 text-sm font-semibold transition ${
                current ? "bg-raised text-ink" : "text-muted hover:bg-raised/60 hover:text-ink"
              }`}
            >
              <span className="truncate">{c.name}</span>
              <span className="label flex-none">{c.state}</span>
            </Link>
          );
        })}
      </aside>

      <div className="flex min-w-0 flex-col gap-8">
        {/* Sticky header */}
        <header className="sticky top-14 z-20 -mx-4 -mb-4 flex h-14 items-center gap-1 border-b border-line bg-bg/90 px-2 backdrop-blur min-[840px]:top-0 min-[840px]:mx-0 min-[840px]:px-0">
          <Link
            href="/cities"
            aria-label="Back to cities"
            className="flex h-11 w-11 flex-none items-center justify-center rounded text-muted transition hover:bg-raised hover:text-ink"
          >
            <Icon name="arrow_back" size={22} />
          </Link>
          <p className="min-w-0 truncate text-base font-bold">{city.name}</p>
        </header>

        {/* Hero */}
        <section>
          <h1 className="text-display tracking-tight">{city.name}</h1>
          <p className="label mt-1 tabular-nums">
            {city.state} · {city.drive}
          </p>
          <p className="mt-3 max-w-prose text-base text-muted">{city.tagline}</p>
          <div className="mt-5">
            <WalkStrip city={city} />
          </div>
          <div className="mt-5">
            <Link
              href={`/vote?city=${city.id}`}
              className={`${votedHere ? "btn-ghost" : "btn-accent"} w-full min-[840px]:w-auto`}
            >
              {votedHere ? "Change your hotel" : `Make ${city.name} your vote`}
            </Link>
          </div>
        </section>

        {/* Constellation peek <-> live map */}
        <section ref={mapAnchor} className="scroll-mt-32 min-[840px]:scroll-mt-4">
          <div
            className={`overflow-hidden transition-[height] duration-200 ease-out ${
              mapOpen ? "h-[400px] min-[840px]:h-[500px]" : "h-[170px]"
            }`}
          >
            {mapOpen ? (
              <CityMap
                city={city}
                focusId={focusId}
                onPinTap={onPinTap}
                onCollapse={() => setMapOpen(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                aria-label={`Expand the live ${city.name} map`}
                className="card relative block h-[170px] w-full overflow-hidden text-left transition hover:border-line-strong"
              >
                <ConstellationMap city={city} />
                <span className="label absolute bottom-3 right-3 flex h-7 items-center gap-1 rounded bg-bg/70 px-2 text-muted backdrop-blur">
                  <Icon name="open_in_full" size={14} />
                  Live map
                </span>
              </button>
            )}
          </div>
        </section>

        {/* Vote */}
        <section className="card flex items-center gap-4 p-5">
          {votedHere ? (
            <>
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded bg-accent-soft">
                <Icon name="how_to_vote" size={22} className="text-accent" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="label">Your current vote</p>
                <p className="mt-0.5 truncate text-base font-bold">
                  {myHotel ? myHotel.name : city.name}
                </p>
              </div>
              <Link href={`/vote?city=${city.id}`} className="btn-ghost flex-none">
                Change
              </Link>
            </>
          ) : (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold">Make {city.name} your vote</p>
                {tally && (
                  <div className="mt-2">
                    <VoterAvatars voters={tally.voters} size="sm" />
                  </div>
                )}
              </div>
              <Link href={`/vote?city=${city.id}`} className="btn-accent flex-none">
                Vote
              </Link>
            </>
          )}
        </section>

        {/* Hotels */}
        <section>
          <h2 className="label mb-3">Hotels</h2>
          <div className="flex flex-col gap-4">
            {city.hotels.map((h) => (
              <HotelCard
                key={h.id}
                city={city}
                hotel={h}
                voters={tally?.hotelRanking.find((r) => r.hotel.id === h.id)?.voters ?? []}
              />
            ))}
          </div>
        </section>

        {/* Bars */}
        <section>
          <h2 className="label mb-1">Bars</h2>
          <div className="flex flex-col">
            {city.bars.map((b) => (
              <VenueRow key={b.id} venue={b} kind="bar" onTap={() => focusFromList(b.id)} />
            ))}
          </div>
        </section>

        {/* Food */}
        <section>
          <h2 className="label mb-1">Food</h2>
          <div className="flex flex-col">
            {city.food.map((f) => (
              <VenueRow key={f.id} venue={f} kind="food" onTap={() => focusFromList(f.id)} />
            ))}
          </div>
        </section>

        <VenueSheet city={city} venue={sheetVenue} onClose={() => setSheetId(null)} />
      </div>
    </div>
  );
}
