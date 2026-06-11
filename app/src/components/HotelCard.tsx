"use client";

import { useState } from "react";
import type { City, Hotel } from "@/data/types";
import { formatWalkDistance, haversineMiles } from "@/lib/geo";
import { cityMeta } from "@/lib/score";
import { Icon } from "./Icon";
import { Stars, UnverifiedFlag } from "./Pills";

interface HotelCardProps {
  city: City;
  hotel: Hotel;
  voteCount: number;
}

/**
 * Expanding the card reveals walking distance from THIS hotel to every bar
 * and food spot (Haversine; ft under 1000 ft, miles over).
 */
export function HotelCard({ city, hotel, voteCount }: HotelCardProps) {
  const [open, setOpen] = useState(false);
  const meta = cityMeta[city.id];
  const centroidMi =
    hotel.coords && meta.barCentroid ? haversineMiles(hotel.coords, meta.barCentroid) : null;

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-surface-2"
      >
        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon name="hotel" size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-base font-extrabold">{hotel.name}</span>
            {!hotel.verified && <UnverifiedFlag note={hotel.unverifiedNote} />}
            {voteCount > 0 && (
              <span className="inline-flex h-5 items-center gap-0.5 rounded-full bg-accent-soft px-1.5 text-2xs font-extrabold text-accent">
                <Icon name="how_to_vote" size={12} />
                {voteCount}
              </span>
            )}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-semibold text-muted">
            <Stars count={hotel.stars} />
            <span>{hotel.priceRange}</span>
            {centroidMi !== null && (
              <span className="inline-flex items-center gap-1 text-good">
                <Icon name="directions_walk" size={14} />
                {formatWalkDistance(centroidMi)} to bar cluster
              </span>
            )}
          </span>
          {hotel.address && <span className="mt-1 block text-xs text-faint">{hotel.address}</span>}
          {hotel.distanceNote && (
            <span className="mt-1 block text-xs italic text-muted">{hotel.distanceNote}</span>
          )}
          {hotel.onSite && (
            <span className="mt-1 flex items-start gap-1 text-xs text-muted">
              <Icon name="local_bar" size={14} className="mt-0.5" />
              {hotel.onSite}
            </span>
          )}
        </span>
        <Icon
          name="expand_more"
          size={22}
          className={`mt-1 text-faint transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="anim-fade border-t border-line bg-surface-2/50 p-4">
          {hotel.website && (
            <a
              href={hotel.website}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost mb-4 w-full"
            >
              <Icon name="open_in_new" size={18} />
              Hotel website
            </a>
          )}
          {hotel.coords ? (
            <div className="grid gap-x-6 gap-y-1 min-[840px]:grid-cols-2">
              <WalkList title="Bars" icon="sports_bar" tone="text-good" city={city} hotel={hotel} kind="bars" />
              <WalkList title="Food" icon="restaurant" tone="text-food" city={city} hotel={hotel} kind="food" />
            </div>
          ) : (
            <p className="text-sm text-muted">
              No coordinates for this hotel yet, so walking distances can&apos;t be calculated.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function WalkList({
  title,
  icon,
  tone,
  city,
  hotel,
  kind,
}: {
  title: string;
  icon: string;
  tone: string;
  city: City;
  hotel: Hotel;
  kind: "bars" | "food";
}) {
  return (
    <div className="min-w-0">
      <p className={`mb-1 flex items-center gap-1 text-2xs font-extrabold uppercase tracking-wider ${tone}`}>
        <Icon name={icon} size={14} />
        {title}
      </p>
      <ul className="mb-3">
        {city[kind].map((v) => (
          <li
            key={v.id}
            className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1.5 text-sm last:border-0"
          >
            <span className="min-w-0 truncate font-semibold">{v.name}</span>
            <span className="whitespace-nowrap font-bold tabular-nums text-muted">
              {v.coords && hotel.coords ? formatWalkDistance(haversineMiles(hotel.coords, v.coords)) : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
