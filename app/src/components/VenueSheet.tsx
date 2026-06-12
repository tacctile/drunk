"use client";

import { mapsUrl, priceSymbols, type Venue } from "@/lib/venues";
import { PIN_COLORS } from "@/lib/maps";
import { BottomSheet } from "./BottomSheet";
import { Icon } from "./Icon";

interface VenueSheetProps {
  venue: Venue | null;
  onClose: () => void;
}

const KIND_LABELS = { hotel: "Hotel", bar: "Bar", food: "Food" } as const;

/** Pin-tap sheet: name, tappable address, rating, price level. */
export function VenueSheet({ venue, onClose }: VenueSheetProps) {
  return (
    <BottomSheet open={venue !== null} onClose={onClose} label={venue?.name ?? "Venue"}>
      {venue && (
        <div className="flex flex-col gap-1 px-1 pb-2">
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: PIN_COLORS[venue.kind] }}
            />
            <span className="label">{KIND_LABELS[venue.kind]}</span>
          </span>
          <h3 className="text-title font-bold text-ink">{venue.name}</h3>
          {(venue.rating !== null || venue.priceLevel !== null || venue.priceText) && (
            <p className="flex items-center gap-3 text-meta font-normal text-ink-muted">
              {venue.rating !== null && (
                <span className="flex items-center gap-1">
                  <Icon name="star" filled size={16} className="text-accent" />
                  {venue.rating.toFixed(1)}
                  {venue.ratingCount !== null && ` (${venue.ratingCount})`}
                </span>
              )}
              {priceSymbols(venue.priceLevel) && (
                <span className="font-semibold text-accent">{priceSymbols(venue.priceLevel)}</span>
              )}
              {!venue.priceLevel && venue.priceText && <span>{venue.priceText}</span>}
            </p>
          )}
          {venue.address && (
            <a
              href={mapsUrl(venue.name, venue.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2 text-meta font-normal text-ink-muted transition hover:text-ink"
            >
              <Icon name="location_on" size={18} className="text-ink-dim" />
              <span className="underline decoration-border-strong underline-offset-4">
                {venue.address}
              </span>
            </a>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
