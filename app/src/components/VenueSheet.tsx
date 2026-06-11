"use client";

import type { City, VenueKind } from "@/data/types";
import { formatWalkDistance, haversineMiles } from "@/lib/geo";
import { cityMeta } from "@/lib/score";
import { BottomSheet } from "./BottomSheet";
import { Icon } from "./Icon";
import { Stars } from "./Stars";

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
}

export function findSheetVenue(city: City, id: string | null): SheetVenue | null {
  if (!id) return null;
  const hotel = city.hotels.find((h) => h.id === id);
  if (hotel) {
    return {
      id: hotel.id,
      kind: "hotel",
      name: hotel.name,
      address: hotel.address,
      stars: hotel.stars,
      priceRange: hotel.priceRange,
      onSite: hotel.onSite,
      coords: hotel.coords,
    };
  }
  const bar = city.bars.find((b) => b.id === id);
  if (bar) return { ...bar, kind: "bar" };
  const food = city.food.find((f) => f.id === id);
  if (food) return { ...food, kind: "food" };
  return null;
}

const KIND_LABEL: Record<VenueKind, string> = { hotel: "Hotel", bar: "Bar", food: "Food" };

/** Venue details opened from map pins. Never links out to maps. */
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
          <p className="label mb-1.5 flex items-center gap-1.5 text-muted">
            <KindGlyph kind={venue.kind} />
            {KIND_LABEL[venue.kind]}
          </p>
          <h3 className="text-xl font-bold tracking-tight">{venue.name}</h3>
          {venue.stars !== undefined && (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <Stars count={venue.stars} />
              <span className="tabular-nums">{venue.priceRange}</span>
            </p>
          )}
          {venue.address && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
              <Icon name="location_on" size={17} className="mt-0.5" />
              {venue.address}
            </p>
          )}
          {venue.description && <p className="mt-3 text-base text-ink">{venue.description}</p>}
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
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-muted">
              <Icon name="directions_walk" size={16} />
              <span className="tabular-nums">
                {formatWalkDistance(haversineMiles(walkFromBest.coords, venue.coords))}
              </span>{" "}
              from {walkFromBest.name}
            </p>
          )}
        </div>
      )}
    </BottomSheet>
  );
}

function KindGlyph({ kind }: { kind: VenueKind }) {
  if (kind === "hotel") return <span className="inline-block h-2 w-2 bg-accent" aria-hidden />;
  if (kind === "bar")
    return <span className="inline-block h-2 w-2 rounded-full bg-ink" aria-hidden />;
  return <span className="inline-block h-2 w-2 rounded-full border-2 border-muted" aria-hidden />;
}
