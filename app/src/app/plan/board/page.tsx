"use client";

import { useMemo, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import type { City } from "@/data/types";
import { useAvailability } from "@/hooks/useAvailability";
import { useGroupData } from "@/hooks/useGroupData";
import { useVenues } from "@/hooks/useVenues";
import { useVotes } from "@/hooks/useVotes";
import { formatShortDate, plural } from "@/lib/format";
import { Stars } from "@/components/Stars";
import { SectionLabel, Card, ActionButton, OverlayHeader } from "@hoppz-ui";

/** Small drill-down trigger — "See Votes" / "See Who". */
function SeeButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <ActionButton variant="ghost" label={label} onClick={onClick} />;
}

/** Sheet heading with the close button top right. */
function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return <OverlayHeader title={title} onBack={onClose} />;
}

/** Low end of a "$X-$Y/night" range; unparseable sorts last. */
function lowPrice(range: string | undefined): number {
  const m = range?.match(/\d+/);
  return m ? Number(m[0]) : Number.MAX_SAFE_INTEGER;
}

/**
 * Top hotels in the leading city — preference counts from v2_hotel_votes,
 * stars/price joined against the curated v2_hotels rows by hotel name.
 * Only rendered when the leading city has at least one hotel vote.
 */
function HotelSection({ city, prefs }: { city: City; prefs: { name: string; count: number }[] }) {
  const { venues } = useVenues(city);

  const rows = useMemo(() => {
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
      .slice(0, 3)
      .map((p) => ({ ...p, stars: info(p.name)?.stars ?? 0 }));
  }, [prefs, venues.hotel]);

  return (
    <section className="mt-6">
      <div className="pb-2"><SectionLabel>Top Hotels in Top Voted City</SectionLabel></div>
      <ul className="flex flex-col gap-2">
        {rows.map((hotel) => (
          <Card key={hotel.name} className="flex min-h-[56px] flex-col justify-center gap-1 px-3 py-2">
            <p className="truncate text-title text-ink">{hotel.name}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-meta font-bold text-accent">
                {hotel.count === 1 ? "1 prefers this" : `${hotel.count} prefer this`}
              </span>
              <Stars count={hotel.stars} />
            </div>
          </Card>
        ))}
      </ul>
    </section>
  );
}

/**
 * The Board (the Results tab) — group truth, read-only. Two card columns,
 * side by side at every width: top 5 cities by votes left, top 5 dates by
 * available count right, each row drilling into a bottom sheet of names.
 * Below them, the top 3 hotel preferences for the leading city (hidden
 * until it has hotel votes).
 */
export default function BoardPage() {
  const { breakdownFor, allResponseDates } = useAvailability();
  const { ranking } = useVotes();
  const { hotelVotes, voters } = useGroupData();
  const [citySheetId, setCitySheetId] = useState<string | null>(null);
  const [dateSheetKey, setDateSheetKey] = useState<string | null>(null);

  const topCities = ranking.slice(0, 5);
  // Dates with at least one response, most available people first.
  const hotDates = allResponseDates
    .map((date) => breakdownFor(date))
    .sort((a, b) => b.available.length - a.available.length || a.date.localeCompare(b.date))
    .slice(0, 5);

  const leading = ranking[0] ?? null;
  // Hotel preferences for the leading city only, grouped by hotel name (by
  // name, not place_id, so legacy Google-place rows still count). Disabled
  // voters are excluded here like in every other group view — this is the
  // one read that bypasses the already-filtered useVotes hook.
  const leadingHotelPrefs = useMemo(() => {
    if (!leading) return [];
    const inactive = new Set(
      voters.filter((v) => v.is_active === false).map((v) => v.voter_id),
    );
    const counts = new Map<string, number>();
    for (const row of hotelVotes) {
      if (row.city_id !== leading.city.id || inactive.has(row.voter_id)) continue;
      counts.set(row.hotel_name, (counts.get(row.hotel_name) ?? 0) + 1);
    }
    return [...counts].map(([name, count]) => ({ name, count }));
  }, [hotelVotes, voters, leading]);

  const citySheet = citySheetId ? ranking.find((t) => t.city.id === citySheetId) ?? null : null;
  const dateSheet = dateSheetKey ? breakdownFor(dateSheetKey) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4">
      {/* Section 1 — two columns, side by side at every width */}
      <div className="grid grid-cols-2 items-start gap-3">
        <section>
          <div className="pb-2"><SectionLabel>Top Cities</SectionLabel></div>
          {topCities.length === 0 ? (
            <p className="py-10 text-center text-meta font-normal text-ink-dim">No votes yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {topCities.map((tally) => (
                <Card key={tally.city.id} className="flex min-h-[56px] flex-col justify-center gap-1 px-3 py-2">
                  <p className="truncate text-title text-ink">{tally.city.name}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-meta font-bold text-accent">
                      {plural(tally.count, "vote")}
                    </span>
                    <SeeButton label="See Votes" onClick={() => setCitySheetId(tally.city.id)} />
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="pb-2"><SectionLabel>Hot Dates</SectionLabel></div>
          {hotDates.length === 0 ? (
            <p className="py-10 text-center text-meta font-normal text-ink-dim">
              No dates marked yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {hotDates.map((day) => (
                <Card key={day.date} className="flex min-h-[56px] flex-col justify-center gap-1 px-3 py-2">
                  <p className="truncate text-title text-ink">
                    {formatShortDate(day.date).replace(",", "")}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-meta font-bold text-accent">
                      {day.available.length} free
                    </span>
                    <SeeButton label="See Who" onClick={() => setDateSheetKey(day.date)} />
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Section 2 — top hotels in the leading city; hidden without hotel votes */}
      {leading && leadingHotelPrefs.length > 0 && (
        <HotelSection city={leading.city} prefs={leadingHotelPrefs} />
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
                <li key={voter.voterId} className="flex h-11 items-center text-base text-ink">
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
        label={dateSheet ? formatShortDate(dateSheet.date) : "Date availability"}
      >
        {dateSheet && (
          <>
            <SheetHeader
              title={formatShortDate(dateSheet.date)}
              onClose={() => setDateSheetKey(null)}
            />
            {dateSheet.available.length > 0 && (
              <>
                <div className="pb-1 pt-2"><SectionLabel>Available</SectionLabel></div>
                <ul>
                  {dateSheet.available.map((person) => (
                    <li key={person.voterId} className="flex h-11 items-center text-base text-green">
                      {person.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {dateSheet.unavailable.length > 0 && (
              <>
                <div className="pb-1 pt-2"><SectionLabel>Not available</SectionLabel></div>
                <ul>
                  {dateSheet.unavailable.map((person) => (
                    <li key={person.voterId} className="flex h-11 items-center text-base text-red">
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
