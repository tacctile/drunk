"use client";

import type { Venue, VenueKind } from "@/data/types";
import { Icon } from "./Icon";

interface VenueRowProps {
  venue: Venue;
  kind: Exclude<VenueKind, "hotel">;
  onTap: () => void;
}

/**
 * Bar / food list row. The glyph mirrors the map's shape language:
 * filled near-white dot = bar, outlined muted circle = food.
 * Tapping expands the map and pans to this venue's pin.
 */
export function VenueRow({ venue, kind, onTap }: VenueRowProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="flex min-h-14 w-full items-start gap-3 border-b border-line py-3 text-left transition last:border-0 hover:bg-raised/40"
    >
      <span
        aria-hidden
        className={`mt-2 h-2.5 w-2.5 flex-none rounded-full ${
          kind === "bar" ? "bg-ink" : "border-2 border-muted"
        }`}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold">{venue.name}</span>
        {venue.address && <span className="mt-0.5 block text-sm text-dim">{venue.address}</span>}
        {venue.description && (
          <span className="mt-1 block text-sm text-muted">{venue.description}</span>
        )}
      </span>
      {venue.coords && <Icon name="chevron_right" size={20} className="mt-1.5 text-dim" />}
    </button>
  );
}
