"use client";

import { useState } from "react";
import type { City, Hotel } from "@/data/types";
import type { VoterTag } from "@/hooks/useVotes";
import { formatWalkDistance, haversineMiles } from "@/lib/geo";
import { Icon } from "./Icon";
import { Stars } from "./Stars";
import { VoterAvatars } from "./VoterAvatars";
import { WalkStrip } from "./WalkStrip";

interface HotelCardProps {
  city: City;
  hotel: Hotel;
  voters: VoterTag[];
}

/**
 * One hotel, measured: name, stars, price, the per-hotel walk strip, and the
 * initials of everyone voting for it. Expanding reveals the walking distance
 * to every bar and food spot. The website link is the app's only external link.
 */
export function HotelCard({ city, hotel, voters }: HotelCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="block w-full p-5 text-left transition hover:bg-raised/40"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold">{hotel.name}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted">
              <Stars count={hotel.stars} />
              <span className="tabular-nums">{hotel.priceRange}</span>
            </p>
          </div>
          <Icon
            name="expand_more"
            size={22}
            className={`mt-0.5 flex-none text-dim transition ${open ? "rotate-180" : ""}`}
          />
        </div>
        {hotel.onSite && <p className="mt-2 text-sm text-muted">{hotel.onSite}</p>}
        <div className="mt-4">
          <WalkStrip city={city} hotel={hotel} />
        </div>
        {voters.length > 0 && (
          <div className="mt-3">
            <VoterAvatars voters={voters} size="sm" />
          </div>
        )}
      </button>

      {hotel.website && (
        <div className="border-t border-line px-5">
          <a
            href={hotel.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
          >
            <Icon name="open_in_new" size={16} />
            Website
          </a>
        </div>
      )}

      {open && (
        <div className="anim-fade border-t border-line p-5">
          {hotel.coords ? (
            <div className="grid gap-x-8 gap-y-4 min-[840px]:grid-cols-2">
              <WalkList city={city} hotel={hotel} kind="bars" title="Bars" />
              <WalkList city={city} hotel={hotel} kind="food" title="Food" />
            </div>
          ) : (
            <p className="text-sm text-muted">
              No location on file for this hotel yet, so walking distances can&apos;t be measured.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function WalkList({
  city,
  hotel,
  kind,
  title,
}: {
  city: City;
  hotel: Hotel;
  kind: "bars" | "food";
  title: string;
}) {
  if (city[kind].length === 0) return null;
  return (
    <div className="min-w-0">
      <p className="label mb-2">{title}</p>
      <ul>
        {city[kind].map((v) => (
          <li
            key={v.id}
            className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1.5 text-sm last:border-0"
          >
            <span className="min-w-0 truncate font-semibold">{v.name}</span>
            <span className="whitespace-nowrap tabular-nums text-muted">
              {v.coords && hotel.coords
                ? formatWalkDistance(haversineMiles(hotel.coords, v.coords))
                : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
