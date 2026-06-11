"use client";

import type { City, VenueKind } from "@/data/types";
import { formatWalkDistance, haversineMiles } from "@/lib/geo";
import { cityMeta } from "@/lib/score";
import { PIN_COLORS } from "@/lib/maps";
import { BottomSheet } from "./BottomSheet";
import { Icon } from "./Icon";
import { Stars, UnverifiedFlag } from "./Pills";

export interface SheetVenue {
  id: string;
  kind: VenueKind;
  name: string;
  address: string;
  description?: string;
  hours?: string;
  stars?: number;
  priceRange?: string;
  onSite?: string;
  coords?: { lat: number; lng: number };
  verified: boolean;
  unverifiedNote?: string;
}

export function findSheetVenue(city: City, id: string | null): SheetVenue | null {
  if (!id) return null;
  const hotel = city.hotels.find((h) => h.id === id);
  if (hotel) return { ...hotel, kind: "hotel", description: hotel.distanceNote };
  const bar = city.bars.find((b) => b.id === id);
  if (bar) return { ...bar, kind: "bar" };
  const food = city.food.find((f) => f.id === id);
  if (food) return { ...food, kind: "food" };
  return null;
}

const KIND_LABEL: Record<VenueKind, string> = { hotel: "Hotel", bar: "Bar", food: "Food" };

/** Venue details opened from map pins and list rows. Never links out to maps. */
export function VenueSheet({
  city,
  venue,
  onClose,
}: {
  city: City;
  venue: SheetVenue | null;
  onClose: () => void;
}) {
  const meta = venue ? cityMeta[city.id] : null;
  const walkFromBest =
    venue?.coords && meta?.nearestHotelId
      ? city.hotels.find((h) => h.id === meta.nearestHotelId)
      : null;

  return (
    <BottomSheet open={venue !== null} onClose={onClose} label={venue?.name ?? "Venue"}>
      {venue && (
        <div className="pt-1">
          <p
            className="mb-1 flex items-center gap-1.5 text-2xs font-extrabold uppercase tracking-wider"
            style={{ color: PIN_COLORS[venue.kind] }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full border border-white/80"
              style={{ background: PIN_COLORS[venue.kind] }}
            />
            {KIND_LABEL[venue.kind]}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-extrabold tracking-tight">{venue.name}</h3>
            {!venue.verified && <UnverifiedFlag note={venue.unverifiedNote} />}
          </div>
          {venue.stars !== undefined && (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <Stars count={venue.stars} />
              {venue.priceRange}
            </p>
          )}
          {venue.address ? (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
              <Icon name="location_on" size={17} className="mt-0.5" />
              {venue.address}
            </p>
          ) : (
            <p className="mt-2 text-sm italic text-faint">Address not yet verified.</p>
          )}
          {venue.description && <p className="mt-2 text-sm leading-6 text-ink">{venue.description}</p>}
          {venue.hours && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
              <Icon name="schedule" size={17} />
              {venue.hours}
            </p>
          )}
          {venue.onSite && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
              <Icon name="local_bar" size={17} className="mt-0.5" />
              {venue.onSite}
            </p>
          )}
          {venue.kind !== "hotel" && walkFromBest?.coords && venue.coords && (
            <p className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-good-soft px-3 text-xs font-bold text-good">
              <Icon name="directions_walk" size={16} />
              {formatWalkDistance(haversineMiles(walkFromBest.coords, venue.coords))} from {walkFromBest.name}
            </p>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
