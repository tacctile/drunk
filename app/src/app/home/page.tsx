"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { Dialog } from "@/components/Dialog";
import { Switch } from "@/components/Switch";
import { setLastWing } from "@/lib/auth";
import { fromDateKey, toDateKey } from "@/lib/format";
import { useVotes } from "@/hooks/useVotes";
import { useAvailability } from "@/hooks/useAvailability";
import { useGroupData } from "@/hooks/useGroupData";
import { useLocations } from "@/hooks/useLocations";
import { useTripData } from "@/hooks/useTripData";

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const GRADE_BADGE: Record<string, string> = {
  a: "bg-grade-a/15 text-grade-a",
  b: "bg-grade-b/15 text-grade-b",
  c: "bg-grade-c/15 text-grade-c",
  d: "bg-grade-d/15 text-grade-d",
  f: "bg-grade-f/15 text-grade-f",
};

function gradeKey(grade: string): string {
  const k = grade.charAt(0).toLowerCase();
  return k in GRADE_BADGE ? k : "f";
}

export default function HomePage() {
  const router = useRouter();
  const { ranking, hasVoted } = useVotes();
  const { bestDate, hasMarkedDates } = useAvailability();
  const { voterId, voters, cityVotes } = useGroupData();
  const { isSharing, amDisabled, toggleSharing } = useLocations();
  const { members, setMemberStatus } = useTripData();

  const [modalOpen, setModalOpen] = useState(false);
  const [locBusy, setLocBusy] = useState(false);

  const myStatus = useMemo(
    () => members.find((m) => m.voter_id === voterId)?.trip_status ?? "on_trip",
    [members, voterId],
  );

  const topHotelName = ranking[0]?.hotelPrefs[0]?.name ?? null;

  const bestWeekend = useMemo(() => {
    if (!bestDate) return null;
    const d1 = fromDateKey(bestDate.date);
    const d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate() + 1);
    return { d1, d2, day2Key: toDateKey(d2), dow: d1.getDay() };
  }, [bestDate]);

  const sortedActiveVoters = useMemo(() => {
    const active = voters.filter((v) => v.is_active !== false);
    const voted = new Set(cityVotes.map((cv) => cv.voter_id));
    return [...active].sort((a, b) => {
      const av = voted.has(a.voter_id);
      const bv = voted.has(b.voter_id);
      if (av !== bv) return av ? -1 : 1;
      return (a.display_name ?? a.name).localeCompare(b.display_name ?? b.name);
    });
  }, [voters, cityVotes]);

  const alphabeticalVoters = useMemo(
    () =>
      [...sortedActiveVoters].sort((a, b) =>
        (a.display_name ?? a.name).localeCompare(b.display_name ?? b.name),
      ),
    [sortedActiveVoters],
  );

  const handleLocationToggle = async () => {
    if (locBusy) return;
    setLocBusy(true);
    await toggleSharing();
    setLocBusy(false);
  };

  const showAll = sortedActiveVoters.length <= 7;
  const visibleVoters = showAll
    ? sortedActiveVoters
    : sortedActiveVoters.slice(0, 6);
  const overflowCount = sortedActiveVoters.length - 6;

  return (
    <div className="mx-auto max-w-2xl pb-[calc(64px+env(safe-area-inset-bottom))]">
      {/* Section 1: Trip Anchor Card */}
      <div className="mx-4 mt-4 rounded-card border bg-surface p-4">
        {/* Top City */}
        <div>
          <span className="text-label uppercase text-ink-muted">Top City</span>
          {ranking[0] ? (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-display text-ink">
                {ranking[0].city.name}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-meta font-bold ${GRADE_BADGE[gradeKey(ranking[0].city.walkGrade)]}`}
              >
                {ranking[0].city.walkGrade}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-display text-ink-dim">No votes yet</p>
          )}
        </div>

        <div className="my-3 border-t" />

        {/* Top Hotel */}
        <div>
          <span className="text-label uppercase text-ink-muted">Top Hotel</span>
          {topHotelName ? (
            <p className="mt-1 text-title text-ink">{topHotelName}</p>
          ) : (
            <p className="mt-1 text-title text-ink-dim">No preference yet</p>
          )}
        </div>

        <div className="my-3 border-t" />

        {/* Best Weekend */}
        <div>
          <span className="text-label uppercase text-ink-muted">
            Best Weekend
          </span>
          {bestWeekend ? (
            <>
              {(bestWeekend.dow === 5 || bestWeekend.dow === 6) && (
                <p className="mt-1 text-meta text-ink-muted">
                  {bestWeekend.dow === 5 ? "Fri – Sat" : "Sat – Sun"}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <div className="flex-1 rounded-btn border bg-raised p-3 text-center">
                  <span className="block text-label uppercase text-ink-muted">
                    {DAY_ABBR[bestWeekend.d1.getDay()]}
                  </span>
                  <span className="block text-title text-ink">
                    {MONTH_ABBR[bestWeekend.d1.getMonth()]}{" "}
                    {bestWeekend.d1.getDate()}
                  </span>
                </div>
                <div className="flex-1 rounded-btn border bg-raised p-3 text-center">
                  <span className="block text-label uppercase text-ink-muted">
                    {DAY_ABBR[bestWeekend.d2.getDay()]}
                  </span>
                  <span className="block text-title text-ink">
                    {MONTH_ABBR[bestWeekend.d2.getMonth()]}{" "}
                    {bestWeekend.d2.getDate()}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-2">
              <div className="w-full rounded-btn border bg-raised p-3 text-center">
                <span className="text-title text-ink-dim">No dates yet</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Who's Going */}
      <div className="px-4 pt-6">
        <span className="text-label uppercase text-ink-muted">
          Who&apos;s Going
        </span>
        <div className="mt-2 flex flex-row">
          {visibleVoters.map((v, i) => (
            <span
              key={v.voter_id}
              style={i > 0 ? { marginLeft: -12 } : undefined}
            >
              <Avatar voter={v} size={44} />
            </span>
          ))}
          {!showAll && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center rounded-full border bg-raised text-meta font-bold text-ink-muted"
              style={{ width: 44, height: 44, marginLeft: -12 }}
            >
              +{overflowCount}
            </button>
          )}
        </div>
      </div>

      {/* Everyone Going Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Everyone Going"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="absolute -top-10 right-0 flex h-11 w-11 items-center justify-center text-ink-muted"
          >
            <Icon name="close" size={24} />
          </button>
          <div className="max-h-[60vh] overflow-y-auto">
            {alphabeticalVoters.map((v) => (
              <div key={v.voter_id} className="flex h-11 items-center gap-3">
                <Avatar voter={v} size={32} />
                <span className="text-base text-ink">
                  {v.display_name ?? v.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Dialog>

      {/* Section 3: My Status */}
      <div className="mx-4 pt-6">
        <span className="text-label uppercase text-ink-muted">My Status</span>

        {/* Trip Status */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => void setMemberStatus(voterId, "on_trip")}
            className={`min-h-[44px] flex-1 rounded-btn border p-3 text-center text-base ${
              myStatus === "on_trip"
                ? "border-green bg-green-dim text-green"
                : "bg-surface text-ink-muted"
            }`}
          >
            Going
          </button>
          <button
            type="button"
            onClick={() => void setMemberStatus(voterId, "remote")}
            className={`min-h-[44px] flex-1 rounded-btn border p-3 text-center text-base ${
              myStatus === "remote"
                ? "border-accent bg-accent-dim text-accent"
                : "bg-surface text-ink-muted"
            }`}
          >
            Remote
          </button>
          <button
            type="button"
            onClick={() => void setMemberStatus(voterId, "out")}
            className={`min-h-[44px] flex-1 rounded-btn border p-3 text-center text-base ${
              myStatus === "out"
                ? "border-red bg-red-dim text-red"
                : "bg-surface text-ink-muted"
            }`}
          >
            Out
          </button>
        </div>

        {/* Location Sharing */}
        <div className="mt-2 flex min-h-[44px] items-center justify-between border-t border-border pt-2">
          <div className="flex items-center gap-2">
            <Icon name="location_on" size={20} className="text-ink-muted" />
            <span className="text-base text-ink">Share My Location</span>
          </div>
          <span
            style={
              amDisabled
                ? { opacity: 0.4, pointerEvents: "none" as const }
                : undefined
            }
          >
            <Switch
              checked={isSharing}
              disabled={locBusy || amDisabled}
              onToggle={() => void handleLocationToggle()}
              ariaLabel="Share my location"
            />
          </span>
        </div>
        {amDisabled && (
          <p className="text-meta text-ink-dim">Disabled by admin.</p>
        )}
        <p className="text-meta text-ink-dim">This only affects Hoppz.</p>
      </div>

      {/* Section 4: My Trip Actions */}
      <div className="flex gap-3 px-4 pt-6 pb-32">
        <button
          type="button"
          onClick={() => router.push("/plan/cities")}
          className="flex min-h-[44px] flex-1 items-center gap-2 rounded-btn border bg-surface p-3"
        >
          <Icon
            name="how_to_vote"
            size={20}
            className={hasVoted ? "text-green" : "text-accent"}
          />
          <span
            className={`text-meta ${hasVoted ? "text-green" : "text-ink"}`}
          >
            {hasVoted ? "Vote Cast ✓" : "Cast Vote"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/plan/calendar")}
          className="flex min-h-[44px] flex-1 items-center gap-2 rounded-btn border bg-surface p-3"
        >
          <Icon
            name="event_available"
            size={20}
            className={hasMarkedDates ? "text-green" : "text-accent"}
          />
          <span
            className={`text-meta ${hasMarkedDates ? "text-green" : "text-ink"}`}
          >
            {hasMarkedDates ? "Availability Set ✓" : "Set Availability"}
          </span>
        </button>
      </div>

      {/* Home Bottom Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-16 items-stretch">
          <button
            type="button"
            onClick={() => {
              setLastWing("plan");
              router.push("/plan");
            }}
            className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-ink-muted transition hover:bg-raised"
          >
            <Icon name="map" size={24} />
            <span className="text-label font-semibold">Plan</span>
          </button>
          <div className="flex items-center">
            <div className="h-6 w-px bg-border" />
          </div>
          <button
            type="button"
            onClick={() => {
              setLastWing("social");
              router.push("/social");
            }}
            className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-ink-muted transition hover:bg-raised"
          >
            <Icon name="sports_bar" size={24} />
            <span className="text-label font-semibold">Hopp</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
