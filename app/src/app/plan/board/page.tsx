"use client";

import { useMemo, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { Icon } from "@/components/Icon";
import { Stars } from "@/components/Stars";
import { DateBadge } from "@/components/ui/DateBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { City } from "@/data/types";
import { useAvailability } from "@/hooks/useAvailability";
import { useGroupData } from "@/hooks/useGroupData";
import { useVenues } from "@/hooks/useVenues";
import { useVotes } from "@/hooks/useVotes";
import { formatShortDate, plural } from "@/lib/format";

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="min-w-0 flex-1 truncate text-title font-bold text-ink">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex h-11 w-11 flex-none items-center justify-center text-ink-muted transition hover:text-ink"
      >
        <Icon name="close" size={22} />
      </button>
    </div>
  );
}

function lowPrice(range: string | undefined): number {
  const m = range?.match(/\d+/);
  return m ? Number(m[0]) : Number.MAX_SAFE_INTEGER;
}

function formatPrice(range: string | undefined): { amount: string; suffix: string } | null {
  if (!range) return null;
  const m = range.match(/\$(\d+)/);
  if (!m) return null;
  return { amount: `$${m[1]}`, suffix: "/nt" };
}

function HotelCarousel({
  city,
  prefs,
}: {
  city: City;
  prefs: { name: string; count: number }[];
}) {
  const { venues } = useVenues(city);

  const cards = useMemo(() => {
    const info = (name: string) => venues.hotel.find((h) => h.name === name);
    return [...prefs]
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        const ha = info(a.name);
        const hb = info(b.name);
        const starDiff = (hb?.stars ?? 0) - (ha?.stars ?? 0);
        if (starDiff !== 0) return starDiff;
        return lowPrice(ha?.price_range) - lowPrice(hb?.price_range);
      })
      .slice(0, 5)
      .map((p) => ({
        ...p,
        stars: info(p.name)?.stars ?? 0,
        price_range: info(p.name)?.price_range,
        descriptor: info(p.name)?.descriptor ?? "",
      }));
  }, [prefs, venues.hotel]);

  if (cards.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-title font-bold text-ink">
          Top Hotels in {city.name}
        </h3>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide">
        {cards.map((hotel) => {
          const price = formatPrice(hotel.price_range);
          return (
            <div
              key={hotel.name}
              className="w-56 flex-shrink-0 overflow-hidden rounded-card border bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-transform active:scale-[0.98]"
            >
              <div className="relative flex h-32 w-full items-end bg-gradient-to-br from-raised via-surface to-raised p-3">
                {hotel.descriptor && (
                  <span className="text-meta text-ink-dim">
                    {hotel.descriptor}
                  </span>
                )}
                {hotel.stars > 0 && (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-raised px-2 py-0.5 border border-border">
                    <Icon
                      name="star"
                      filled
                      size={14}
                      className="text-accent"
                    />
                    <span className="text-xs font-bold text-ink">
                      {hotel.stars}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2 p-3">
                <div>
                  <h4 className="truncate text-label font-semibold text-ink">
                    {hotel.name}
                  </h4>
                  <p className="text-meta text-ink-muted">
                    {city.district}, {city.name}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <div className="flex items-center gap-1 font-bold text-accent">
                    <Icon name="favorite" filled size={18} />
                    <span className="text-xs">
                      {hotel.count} {hotel.count === 1 ? "prefers" : "prefer"}
                    </span>
                  </div>
                  {price && (
                    <span className="text-xs font-extrabold text-ink">
                      {price.amount}
                      <span className="font-normal text-ink-muted">
                        {price.suffix}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function BoardPage() {
  const { breakdownFor, allResponseDates } = useAvailability();
  const { ranking } = useVotes();
  const { hotelVotes, voters } = useGroupData();
  const [citySheetId, setCitySheetId] = useState<string | null>(null);
  const [dateSheetKey, setDateSheetKey] = useState<string | null>(null);

  const topCities = ranking.slice(0, 5);
  const maxVotes = topCities.length > 0 ? topCities[0].count : 1;

  const hotDates = allResponseDates
    .map((date) => breakdownFor(date))
    .sort(
      (a, b) =>
        b.available.length - a.available.length ||
        a.date.localeCompare(b.date),
    )
    .slice(0, 5);

  const leading = ranking[0] ?? null;
  const leadingHotelPrefs = useMemo(() => {
    if (!leading) return [];
    const inactive = new Set(
      voters
        .filter((v) => v.is_active === false)
        .map((v) => v.voter_id),
    );
    const counts = new Map<string, number>();
    for (const row of hotelVotes) {
      if (row.city_id !== leading.city.id || inactive.has(row.voter_id))
        continue;
      counts.set(row.hotel_name, (counts.get(row.hotel_name) ?? 0) + 1);
    }
    return [...counts].map(([name, count]) => ({ name, count }));
  }, [hotelVotes, voters, leading]);

  const citySheet = citySheetId
    ? ranking.find((t) => t.city.id === citySheetId) ?? null
    : null;
  const dateSheet = dateSheetKey ? breakdownFor(dateSheetKey) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pt-6">
      {/* Two-column grid — Cities & Dates */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Top Cities */}
        <GlassCard className="flex flex-col space-y-4 p-4">
          <h3 className="flex items-center gap-1 text-title font-bold text-ink">
            <Icon name="leaderboard" size={18} className="text-accent" />
            Top Cities
          </h3>
          {topCities.length === 0 ? (
            <p className="py-8 text-center text-meta text-ink-dim">
              No votes yet.
            </p>
          ) : (
            <div className="flex flex-grow flex-col space-y-4">
              {topCities.map((tally, i) => {
                const isLeading = i === 0;
                return (
                  <div
                    key={tally.city.id}
                    className={`space-y-2 ${
                      i > 0 ? "border-t border-border pt-3" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-end justify-between">
                        <span className="text-label font-semibold text-ink">
                          {tally.city.name}
                        </span>
                        <span
                          className={`text-meta ${
                            isLeading ? "text-accent" : "text-ink-muted"
                          }`}
                        >
                          {plural(tally.count, "vote")}
                        </span>
                      </div>
                      <ProgressBar
                        percent={(tally.count / maxVotes) * 100}
                        colorClassName={
                          isLeading ? "bg-accent" : "bg-border-strong"
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCitySheetId(tally.city.id)}
                      className={`h-11 w-full rounded-btn bg-raised text-label font-semibold transition hover:bg-border-strong active:scale-[0.98] ${
                        isLeading ? "text-accent" : "text-ink-muted"
                      }`}
                    >
                      See Votes
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Right: Hot Dates */}
        <GlassCard className="flex flex-col space-y-4 p-4">
          <h3 className="flex items-center gap-1 text-title font-bold text-ink">
            <Icon name="event" size={18} className="text-green" />
            Hot Dates
          </h3>
          {hotDates.length === 0 ? (
            <p className="py-8 text-center text-meta text-ink-dim">
              No dates marked yet.
            </p>
          ) : (
            <div className="flex flex-grow flex-col space-y-4">
              {hotDates.map((day, i) => {
                const isTop = i === 0;
                return (
                  <div
                    key={day.date}
                    className={`space-y-2 ${
                      i > 0 ? "border-t border-border pt-3" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <DateBadge
                        dateKey={day.date}
                        variant={isTop ? "primary" : "muted"}
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-label font-semibold text-ink">
                          {formatShortDate(day.date).replace(",", "")}
                        </span>
                        <span
                          className={`text-meta ${
                            isTop ? "text-green" : "text-ink-muted"
                          }`}
                        >
                          {day.available.length} free
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDateSheetKey(day.date)}
                      className={`h-11 w-full rounded-btn bg-raised text-label font-semibold transition hover:bg-border-strong active:scale-[0.98] ${
                        isTop ? "text-green" : "text-ink-muted"
                      }`}
                    >
                      See Who
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Featured Hotels — horizontal scroll carousel */}
      {leading && leadingHotelPrefs.length > 0 && (
        <HotelCarousel city={leading.city} prefs={leadingHotelPrefs} />
      )}

      {/* City votes drill-down */}
      <BottomSheet
        open={citySheet !== null}
        onClose={() => setCitySheetId(null)}
        label={citySheet ? `${citySheet.city.name} votes` : "City votes"}
      >
        {citySheet && (
          <>
            <SheetHeader
              title={`${citySheet.city.name} votes`}
              onClose={() => setCitySheetId(null)}
            />
            <ul>
              {citySheet.voters.map((voter) => (
                <li
                  key={voter.voterId}
                  className="flex h-11 items-center text-base text-ink"
                >
                  {voter.name}
                </li>
              ))}
            </ul>
          </>
        )}
      </BottomSheet>

      {/* Date availability drill-down */}
      <BottomSheet
        open={dateSheet !== null}
        onClose={() => setDateSheetKey(null)}
        label={
          dateSheet ? formatShortDate(dateSheet.date) : "Date availability"
        }
      >
        {dateSheet && (
          <>
            <SheetHeader
              title={formatShortDate(dateSheet.date)}
              onClose={() => setDateSheetKey(null)}
            />
            {dateSheet.available.length > 0 && (
              <>
                <h3 className="pb-1 pt-2 text-label font-semibold uppercase tracking-label text-ink-dim">
                  Available
                </h3>
                <ul>
                  {dateSheet.available.map((person) => (
                    <li
                      key={person.voterId}
                      className="flex h-11 items-center text-base text-green"
                    >
                      {person.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {dateSheet.unavailable.length > 0 && (
              <>
                <h3 className="pb-1 pt-2 text-label font-semibold uppercase tracking-label text-ink-dim">
                  Not available
                </h3>
                <ul>
                  {dateSheet.unavailable.map((person) => (
                    <li
                      key={person.voterId}
                      className="flex h-11 items-center text-base text-red"
                    >
                      {person.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </BottomSheet>
    </div>
  );
}
