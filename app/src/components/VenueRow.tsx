"use client";

import type { Venue, VenueKind } from "@/data/types";
import { Icon } from "./Icon";
import { UnverifiedFlag } from "./Pills";

const KIND_STYLE: Record<Exclude<VenueKind, "hotel">, { icon: string; tone: string }> = {
  bar: { icon: "sports_bar", tone: "bg-good-soft text-good" },
  food: { icon: "restaurant", tone: "bg-[rgba(33,150,243,0.14)] text-food" },
};

interface VenueRowProps {
  venue: Venue;
  kind: Exclude<VenueKind, "hotel">;
  onTap: () => void;
}

/** Bar / food list item. Tapping pans the map to its pin and opens the sheet. */
export function VenueRow({ venue, kind, onTap }: VenueRowProps) {
  const style = KIND_STYLE[kind];
  return (
    <button
      type="button"
      onClick={onTap}
      className="card flex w-full items-start gap-3 p-3 text-left transition hover:border-line-strong hover:bg-surface-2"
    >
      <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${style.tone}`}>
        <Icon name={style.icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold">{venue.name}</span>
          {!venue.verified && <UnverifiedFlag note={venue.unverifiedNote} />}
        </span>
        {venue.address && <span className="mt-0.5 block text-xs text-faint">{venue.address}</span>}
        {venue.description && (
          <span className="mt-1 block text-xs leading-5 text-muted">{venue.description}</span>
        )}
      </span>
      {venue.coords && <Icon name="distance" size={18} className="mt-1 text-faint" />}
    </button>
  );
}
