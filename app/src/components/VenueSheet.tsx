"use client";

import { PIN_COLORS } from "@/lib/maps";
import type { Venue } from "@/lib/venues";
import { BottomSheet } from "./BottomSheet";

interface VenueSheetProps {
  venue: Venue | null;
  onClose: () => void;
}

const KIND_LABELS = { hotel: "Hotel", bar: "Bar", food: "Food" } as const;

/** Pin-tap sheet: name, address, descriptor — plain text, no external links. */
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
          {venue.address && (
            <p className="text-meta font-normal text-ink-muted">{venue.address}</p>
          )}
          {venue.descriptor && (
            <p className="text-meta font-normal text-ink-dim">{venue.descriptor}</p>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
