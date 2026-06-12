"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cityById } from "@/data/cities";
import type { VenueKind } from "@/data/types";
import { useGroupData } from "@/hooks/useGroupData";
import { useVenues } from "@/hooks/useVenues";
import { useVotes } from "@/hooks/useVotes";
import type { Venue } from "@/lib/venues";
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

/** Hotel class as filled accent stars — 3 stars = three filled glyphs. */
function Stars({ count }: { count: number }) {
  const n = Math.max(0, Math.min(5, Math.floor(count)));
  if (n === 0) return null;
  return (
    <span className="flex items-center text-accent" aria-label={`${n}-star hotel`}>
      {Array.from({ length: n }, (_, i) => (
        <Icon key={i} name="star" filled size={14} />
      ))}
    </span>
  );
}

export function CityDetail({ cityId }: { cityId: string }) {
  // The server wrapper 404s unknown ids before this component renders.
  const city = cityById(cityId)!;
  const { venues, ready } = useVenues(city);
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
        {/* Sticky header — back, city + state, vote. Fully opaque, always. */}
        <header className="sticky top-0 z-30 grid h-14 grid-cols-[44px_1fr_44px] items-center border-b bg-bg px-2">
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
          <ul className="mx-auto max-w-2xl">
            {list.map((venue) => (
              <li key={venue.id} className="flex min-h-14 items-center gap-2 border-b py-3 pl-4 pr-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-title font-bold text-ink">{venue.name}</p>
                  {venue.address && (
                    <p className="break-words text-meta font-normal text-ink-muted">{venue.address}</p>
                  )}
                  {tab === "hotel" ? (
                    (venue.stars != null || venue.price_range) && (
                      <p className="flex items-center gap-2 pt-0.5 text-meta font-normal text-ink-muted">
                        {venue.stars != null && <Stars count={venue.stars} />}
                        {venue.price_range && <span>{venue.price_range}</span>}
                      </p>
                    )
                  ) : (
                    <>
                      {venue.descriptor && (
                        <p className="break-words pt-0.5 text-meta font-normal text-ink-dim">
                          {venue.descriptor}
                        </p>
                      )}
                      {(tab === "bar" ? venue.has_food : venue.has_bar) && (
                        <span className="mt-1.5 inline-flex rounded-full bg-raised px-2.5 py-0.5 text-meta font-normal text-ink-muted">
                          {tab === "bar" ? "Also serves food" : "Full bar"}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {tab === "hotel" && (
                  <button
                    type="button"
                    onClick={() => toggleHotel(venue)}
                    className="flex h-11 w-11 flex-none flex-col items-center justify-center gap-1"
                    aria-label={myHotel === venue.id ? "Remove hotel preference" : "Prefer this hotel"}
                  >
                    <span
                      className="ms text-xl"
                      style={{
                        fontVariationSettings: myHotel === venue.id ? "'FILL' 1" : "'FILL' 0",
                        color: myHotel === venue.id ? "var(--accent)" : "var(--ink-dim)",
                      }}
                    >
                      star
                    </span>
                    {myHotel !== venue.id && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-dim">
                        Prefer
                      </span>
                    )}
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
