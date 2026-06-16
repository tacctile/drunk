"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cityById } from "@/data/cities";
import type { VenueKind } from "@/data/types";
import { useGroupData } from "@/hooks/useGroupData";
import { useTripData } from "@/hooks/useTripData";
import { useVenues } from "@/hooks/useVenues";
import { useVotes } from "@/hooks/useVotes";
import type { Venue } from "@/lib/venues";
import { ActionBar } from "@/components/ActionBar";
import { CityList, loadSort, type CitySort } from "@/components/CityList";
import { Stars } from "@/components/Stars";
import { CITY_DETAIL_HEADER_HEIGHT, CityMap, type CityMapHandle } from "@/components/CityMap";
import { Icon } from "@/components/Icon";
import { useNameGate } from "@/components/NamePrompt";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ProfileOverlay } from "@/components/ProfileOverlay";
import { VenueSheet } from "@/components/VenueSheet";

const TABS: { kind: VenueKind; label: string }[] = [
  { kind: "hotel", label: "Hotels" },
  { kind: "bar", label: "Bars" },
  { kind: "food", label: "Food" },
];

const ROW_FLASH_MS = 300;

export function CityDetail({ cityId }: { cityId: string }) {
  const city = cityById(cityId)!;
  const { venues, ready } = useVenues(city);
  const { setCityVote, setHotelPref } = useGroupData();
  const { effectiveStatus } = useTripData();
  const { myCityId, myHotelPrefFor } = useVotes();
  const { requireName, prompt } = useNameGate();
  const votingLocked = effectiveStatus === "upcoming" || effectiveStatus === "active";

  const [tab, setTab] = useState<VenueKind>("hotel");
  const [pinned, setPinned] = useState<Venue | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [listSort, setListSort] = useState<CitySort>("distance");
  useEffect(() => {
    setListSort(loadSort());
  }, []);

  const mapRef = useRef<CityMapHandle>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );
  const focusVenue = (venue: Venue) => {
    if (venue.lat == null || venue.lng == null) return;
    mapRef.current?.focusVenue(venue);
    setFlashId(venue.id);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), ROW_FLASH_MS);
  };

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
      <aside className="hidden border-r min-[840px]:sticky min-[840px]:top-0 min-[840px]:block min-[840px]:h-dvh min-[840px]:overflow-y-auto">
        <CityList sort={listSort} activeCityId={city.id} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-bg px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/plan/cities"
              aria-label="Back to cities"
              className="flex h-11 w-11 items-center justify-center transition active:scale-95"
            >
              <Icon name="arrow_back" size={22} className="text-ink" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-title font-bold leading-tight text-ink">Hoppz</h1>
              <span className="text-meta font-normal text-ink-muted">{city.name}</span>
            </div>
          </div>
          <ProfileAvatar onClick={() => setProfileOpen(true)} />
        </header>

        <CityMap ref={mapRef} city={city} venues={venues} onPinTap={setPinned} />

        <nav
          className="sticky z-20 flex border-b bg-surface"
          style={{ top: CITY_DETAIL_HEADER_HEIGHT }}
        >
          {TABS.map(({ kind, label }) => {
            const active = tab === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setTab(kind)}
                aria-pressed={active}
                className={`flex-1 py-4 text-label uppercase transition ${
                  active
                    ? "border-b-2 border-accent text-accent"
                    : "text-ink-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {!ready ? (
          <p className="px-4 py-10 text-center text-meta font-normal text-ink-dim">
            Loading…
          </p>
        ) : list.length === 0 ? (
          <p className="px-4 py-10 text-center text-meta font-normal text-ink-dim">
            Nothing found near {city.district}.
          </p>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4 px-4 pb-36 pt-6">
            {list.map((venue) => {
              const flashed = flashId === venue.id;
              return tab === "hotel" ? (
                <div
                  key={venue.id}
                  className={`rounded-card border bg-raised p-4 shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition ${
                    flashed ? "ring-1 ring-accent" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => focusVenue(venue)}
                    className="flex w-full gap-4 text-left"
                  >
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-btn bg-surface">
                      <Icon name="apartment" size={32} className="text-ink-dim" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-title font-bold text-ink">
                          {venue.name}
                        </h3>
                        {venue.price_range && (
                          <span className="shrink-0 text-label text-accent">
                            {venue.price_range}
                          </span>
                        )}
                      </div>
                      {venue.address && (
                        <p className="mt-0.5 text-meta font-normal text-ink-muted">
                          {venue.address}
                        </p>
                      )}
                      {venue.stars != null && (
                        <div className="mt-1">
                          <Stars count={venue.stars} showAll />
                        </div>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleHotel(venue)}
                    className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-btn text-label uppercase transition active:scale-[0.98] ${
                      myHotel === venue.id
                        ? "bg-accent text-bg"
                        : "border border-accent text-accent"
                    }`}
                    aria-label={
                      myHotel === venue.id
                        ? "Remove hotel preference"
                        : "Prefer this hotel"
                    }
                  >
                    <Icon
                      name="favorite"
                      size={18}
                      filled={myHotel === venue.id}
                    />
                    {myHotel === venue.id ? "PREFERRED" : "PREFER"}
                  </button>
                </div>
              ) : (
                <div
                  key={venue.id}
                  className={`rounded-card border bg-raised p-4 shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition ${
                    flashed ? "ring-1 ring-accent" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => focusVenue(venue)}
                    className="flex w-full flex-col gap-2 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-title font-bold text-ink">
                          {venue.name}
                        </h3>
                        {venue.address && (
                          <p className="mt-0.5 text-meta font-normal text-ink-muted">
                            {venue.address}
                          </p>
                        )}
                      </div>
                      {renderBadges(tab, venue)}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <ActionBar>
          {votingLocked ? (
            <button
              type="button"
              disabled
              className="flex h-14 w-full items-center justify-center gap-4 rounded-card border bg-raised text-title font-bold text-ink-dim opacity-60 shadow-overlay"
            >
              Voting locked
            </button>
          ) : voted ? (
            <button
              type="button"
              onClick={toggleVote}
              className="flex h-14 w-full items-center justify-center gap-4 rounded-card bg-accent text-title font-bold text-bg shadow-overlay transition active:scale-95"
            >
              <Icon name="how_to_vote" size={24} filled />
              Voted for {city.name}
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleVote}
              className="flex h-14 w-full items-center justify-center gap-4 rounded-card border border-accent bg-raised text-title font-bold text-accent shadow-overlay transition active:scale-95"
            >
              <Icon name="how_to_vote" size={24} />
              Vote for {city.name}
            </button>
          )}
        </ActionBar>

        <VenueSheet venue={pinned} onClose={() => setPinned(null)} />
        <ProfileOverlay
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
        />
        {prompt}
      </div>
    </div>
  );
}

function renderBadges(tab: VenueKind, venue: Venue) {
  const badges: string[] = [];
  if (tab === "bar" && venue.has_food) badges.push("Has Food");
  if (tab === "food" && venue.has_bar) badges.push("Full Bar");
  if (venue.descriptor) badges.push(venue.descriptor);
  if (badges.length === 0) return null;
  return (
    <div className="flex shrink-0 flex-wrap gap-1">
      {badges.map((label) => (
        <span
          key={label}
          className="rounded-full bg-green-dim px-3 py-1 text-[10px] font-bold uppercase tracking-tight text-green"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
