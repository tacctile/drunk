"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cityById } from "@/data/cities";
import type { VenueKind } from "@/data/types";
import { useGroupData } from "@/hooks/useGroupData";
import { usePlaces } from "@/hooks/usePlaces";
import { useVotes } from "@/hooks/useVotes";
import { mapsUrl, priceSymbols, type Venue } from "@/lib/venues";
import { ActionBar } from "@/components/ActionBar";
import { CityList, loadSort, type CitySort } from "@/components/CityList";
import { CityMap } from "@/components/CityMap";
import { Icon } from "@/components/Icon";
import { useNameGate } from "@/components/NamePrompt";
import { VenueSheet } from "@/components/VenueSheet";

const TABS: { kind: VenueKind; label: string }[] = [
  { kind: "hotel", label: "Hotels" },
  { kind: "bar", label: "Bars" },
  { kind: "food", label: "Food" },
];

function AddressLink({ venue }: { venue: Venue }) {
  if (!venue.address) return null;
  return (
    <a
      href={mapsUrl(venue.name, venue.address)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="flex min-h-11 items-center text-meta font-normal text-ink-muted transition hover:text-ink"
    >
      <span className="truncate underline decoration-border-strong underline-offset-4">
        {venue.address}
      </span>
    </a>
  );
}

export function CityDetail({ cityId }: { cityId: string }) {
  // The server wrapper 404s unknown ids before this component renders.
  const city = cityById(cityId)!;
  const { venues, ready } = usePlaces(city);
  const { setCityVote, setHotelPref } = useGroupData();
  const { myCityId, myHotelPrefFor } = useVotes();
  const { requireName, prompt } = useNameGate();

  const [tab, setTab] = useState<VenueKind>("hotel");
  const [pinned, setPinned] = useState<Venue | null>(null);
  const [listSort, setListSort] = useState<CitySort>("distance");
  useEffect(() => {
    setListSort(loadSort());
  }, []);

  const voted = myCityId === city.id;
  const myHotel = myHotelPrefFor(city.id);

  const toggleVote = () => requireName(() => void setCityVote(voted ? null : city.id));
  const toggleHotel = (venue: Venue) =>
    requireName(() =>
      void setHotelPref(
        city.id,
        myHotel === venue.id ? null : { placeId: venue.id, name: venue.name },
      ),
    );

  const list = venues[tab];

  return (
    <div className="min-[840px]:grid min-[840px]:grid-cols-[360px_1fr]">
      {/* Push layout — the index stays visible on desktop */}
      <aside className="hidden border-r min-[840px]:sticky min-[840px]:top-0 min-[840px]:block min-[840px]:h-dvh min-[840px]:overflow-y-auto">
        <CityList sort={listSort} activeCityId={city.id} />
      </aside>

      <div className="min-w-0">
        {/* Sticky header — back, city + state, vote */}
        <header className="sticky top-0 z-30 grid h-14 grid-cols-[44px_1fr_44px] items-center border-b bg-bg/90 px-2 backdrop-blur">
          <Link
            href="/cities"
            aria-label="Back to cities"
            className="flex h-11 w-11 items-center justify-center rounded-btn text-ink-muted transition hover:bg-raised hover:text-ink"
          >
            <Icon name="arrow_back" size={22} />
          </Link>
          <div className="flex items-baseline justify-center gap-1.5 overflow-hidden">
            <span className="truncate text-title font-bold text-ink">{city.name}</span>
            <span className="label flex-none">{city.state}</span>
          </div>
          <button
            type="button"
            onClick={toggleVote}
            aria-label={voted ? `Remove your vote for ${city.name}` : `Vote for ${city.name}`}
            aria-pressed={voted}
            className={`flex h-11 w-11 items-center justify-center rounded-btn transition ${
              voted ? "text-accent" : "text-ink-dim hover:text-ink-muted"
            }`}
          >
            <Icon name="how_to_vote" filled={voted} size={22} />
          </button>
        </header>

        <CityMap city={city} venues={venues} onPinTap={setPinned} />

        {/* Hotels / Bars / Food */}
        <div className="sticky top-[57px] z-20 flex h-11 border-b bg-surface">
          {TABS.map(({ kind, label }) => {
            const active = tab === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setTab(kind)}
                aria-pressed={active}
                className={`relative h-11 flex-1 text-base font-semibold transition ${
                  active ? "text-accent" : "text-ink-muted hover:text-ink"
                }`}
              >
                {label}
                {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
              </button>
            );
          })}
        </div>

        {!ready ? (
          <p className="px-4 py-10 text-center text-meta font-normal text-ink-dim">Loading…</p>
        ) : list.length === 0 ? (
          <p className="px-4 py-10 text-center text-meta font-normal text-ink-dim">
            Nothing found near {city.district}.
          </p>
        ) : (
          <ul className="mx-auto max-w-2xl" role={tab === "hotel" ? "radiogroup" : undefined} aria-label={tab === "hotel" ? "Preferred hotel" : undefined}>
            {list.map((venue) => (
              <li key={venue.id} className="flex min-h-14 items-center gap-2 border-b py-2 pl-4 pr-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-title font-bold text-ink">{venue.name}</p>
                  <AddressLink venue={venue} />
                  {tab === "hotel" ? (
                    <p className="flex items-center gap-2 pb-1 text-meta font-normal text-ink-muted">
                      {priceSymbols(venue.priceLevel) && (
                        <span className="font-semibold text-accent">
                          {priceSymbols(venue.priceLevel)}
                        </span>
                      )}
                      {!venue.priceLevel && venue.priceText && <span>{venue.priceText}</span>}
                      {venue.rating !== null && (
                        <span className="flex items-center gap-1">
                          <Icon name="star" filled size={14} />
                          {venue.rating.toFixed(1)}
                          {venue.ratingCount !== null && ` (${venue.ratingCount})`}
                        </span>
                      )}
                    </p>
                  ) : (
                    venue.descriptor && (
                      <p className="truncate pb-1 text-meta font-normal text-ink-dim">
                        {venue.descriptor}
                      </p>
                    )
                  )}
                </div>
                {tab === "hotel" && (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={myHotel === venue.id}
                    aria-label={`Prefer ${venue.name}`}
                    onClick={() => toggleHotel(venue)}
                    className={`flex h-11 w-11 flex-none items-center justify-center rounded-btn transition ${
                      myHotel === venue.id ? "text-accent" : "text-ink-dim hover:text-ink-muted"
                    }`}
                  >
                    <Icon
                      name={myHotel === venue.id ? "radio_button_checked" : "radio_button_unchecked"}
                      size={22}
                    />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Vote CTA — replaces the sort pill on this page only */}
        <ActionBar>
          {voted ? (
            <button
              type="button"
              onClick={toggleVote}
              className="h-11 w-full rounded-btn bg-accent text-base font-bold text-bg shadow-overlay transition hover:brightness-110"
            >
              Your pick — {city.name} ✓
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleVote}
              className="h-11 w-full rounded-btn border bg-raised text-base font-bold text-accent shadow-overlay transition hover:border-border-strong"
            >
              Vote for {city.name}
            </button>
          )}
        </ActionBar>

        <VenueSheet venue={pinned} onClose={() => setPinned(null)} />
        {prompt}
      </div>
    </div>
  );
}
