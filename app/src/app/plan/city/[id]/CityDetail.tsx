"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { useNameGate } from "@/components/NamePrompt";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ProfileOverlay } from "@/components/ProfileOverlay";
import { VenueSheet } from "@/components/VenueSheet";
import { TopAppBar, TabBar, PreferButton, TagBadge, ActionButton } from "@hoppz-ui";

const TABS: { kind: VenueKind; label: string }[] = [
  { kind: "hotel", label: "Hotels" },
  { kind: "bar", label: "Bars" },
  { kind: "food", label: "Food" },
];

// A tapped venue row flashes --surface-raised this long to confirm the tap.
const ROW_FLASH_MS = 300;

export function CityDetail({ cityId }: { cityId: string }) {
  // The server wrapper 404s unknown ids before this component renders.
  const city = cityById(cityId)!;
  const { venues, ready } = useVenues(city);
  const { setCityVote, setHotelPref } = useGroupData();
  const { effectiveStatus } = useTripData();
  const { myCityId, myHotelPrefFor } = useVotes();
  const { requireName, prompt } = useNameGate();
  const votingLocked = effectiveStatus === "upcoming" || effectiveStatus === "active";

  const [tab, setTab] = useState<VenueKind>("hotel");
  const router = useRouter();
  const [pinned, setPinned] = useState<Venue | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [listSort, setListSort] = useState<CitySort>("distance");
  useEffect(() => {
    setListSort(loadSort());
  }, []);

  // Tap-to-focus: a venue row pans the map to that venue's pin and grows it.
  // A venue with no coords has no pin — the tap does nothing, not even the
  // flash. Only the map moves; the page scrolls only if the map is off-screen.
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
      {/* Push layout — the index stays visible on desktop */}
      <aside className="hidden border-r min-[840px]:sticky min-[840px]:top-0 min-[840px]:block min-[840px]:h-dvh min-[840px]:overflow-y-auto">
        <CityList sort={listSort} activeCityId={city.id} />
      </aside>

      <div className="min-w-0">
        <TopAppBar
          title={city.name}
          subtitle={city.state}
          leadingIcon="arrow_back"
          onLeadingAction={() => router.push("/plan/cities")}
          actions={<ProfileAvatar onClick={() => setProfileOpen(true)} />}
          position="sticky"
        />

        <CityMap ref={mapRef} city={city} venues={venues} onPinTap={setPinned} />

        <TabBar
          tabs={TABS.map((t) => ({ id: t.kind, label: t.label }))}
          activeTab={tab}
          onTabChange={(id) => setTab(id as VenueKind)}
          sticky
          stickyOffset={CITY_DETAIL_HEADER_HEIGHT}
        />

        {!ready ? (
          <p className="px-4 py-10 text-center text-meta font-normal text-ink-dim">Loading…</p>
        ) : list.length === 0 ? (
          <p className="px-4 py-10 text-center text-meta font-normal text-ink-dim">
            Nothing found near {city.district}.
          </p>
        ) : (
          <ul className="mx-auto max-w-2xl">
            {list.map((venue) => (
              <li
                key={venue.id}
                className="flex min-h-14 items-center gap-2 border-b pr-2 transition"
                style={flashId === venue.id ? { background: "var(--surface-raised)" } : undefined}
              >
                {/* The whole info block is the tap target — sibling of the
                    hotel star so the two actions never nest or collide. */}
                <button
                  type="button"
                  onClick={() => focusVenue(venue)}
                  className="min-w-0 flex-1 py-3 pl-4 text-left"
                >
                  <span className="block truncate text-title font-bold text-ink">{venue.name}</span>
                  {venue.address && (
                    <span className="block break-words text-meta font-normal text-ink-muted">
                      {venue.address}
                    </span>
                  )}
                  {tab === "hotel" ? (
                    (venue.stars != null || venue.price_range) && (
                      <span className="flex items-center gap-2 pt-0.5 text-meta font-normal text-ink-muted">
                        {venue.stars != null && <Stars count={venue.stars} />}
                        {venue.price_range && <span>{venue.price_range}</span>}
                      </span>
                    )
                  ) : (
                    <>
                      {venue.descriptor && (
                        <span className="block break-words pt-0.5 text-meta font-normal text-ink-dim">
                          {venue.descriptor}
                        </span>
                      )}
                      {(tab === "bar" ? venue.has_food : venue.has_bar) && (
                        <span className="mt-1.5">
                          <TagBadge label={tab === "bar" ? "Also serves food" : "Full bar"} variant="tertiary" />
                        </span>
                      )}
                    </>
                  )}
                </button>
                {tab === "hotel" && (
                  <div className="flex-none">
                    <PreferButton
                      preferred={myHotel === venue.id}
                      onClick={() => toggleHotel(venue)}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <ActionBar>
          {votingLocked ? (
            <div className="pointer-events-none opacity-60">
              <ActionButton variant="filled" label="Voting locked" fullWidth />
            </div>
          ) : voted ? (
            <ActionButton variant="filled" label={`Your pick — ${city.name} ✓`} onClick={toggleVote} fullWidth />
          ) : (
            <ActionButton variant="ghost" label={`Vote for ${city.name}`} onClick={toggleVote} fullWidth />
          )}
        </ActionBar>

        <VenueSheet venue={pinned} onClose={() => setPinned(null)} />
        <ProfileOverlay open={profileOpen} onClose={() => setProfileOpen(false)} />
        {prompt}
      </div>
    </div>
  );
}
