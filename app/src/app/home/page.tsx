"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { setLastWing } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { formatShortDate } from "@/lib/format";
import { useTripData } from "@/hooks/useTripData";
import { useVotes } from "@/hooks/useVotes";
import { useAvailability } from "@/hooks/useAvailability";
import { useGroupData } from "@/hooks/useGroupData";

export default function HomePage() {
  const router = useRouter();
  const { effectiveStatus, cityName, daysUntil, loading, hotels, members, trip } =
    useTripData();
  const { totalVotes, ranking, hasVoted } = useVotes();
  const { bestDate, hasMarkedDates } = useAvailability();
  const { voterId, voters } = useGroupData();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!voterId) return;
    const sb = getSupabase();
    if (!sb) return;

    async function fetchUnread() {
      const { data: readData } = await sb!
        .from("v2_message_reads")
        .select("read_at")
        .eq("voter_id", voterId)
        .order("read_at", { ascending: false })
        .limit(1)
        .single();

      const lastRead = readData?.read_at ?? new Date(0).toISOString();

      const { count } = await sb!
        .from("v2_messages")
        .select("*", { count: "exact", head: true })
        .eq("is_deleted", false)
        .neq("voter_id", voterId)
        .gt("created_at", lastRead);

      setUnreadCount(count ?? 0);
    }

    void fetchUnread();
  }, [voterId]);

  const { onTripVoters, remoteVoters, onTripCount } = useMemo(() => {
    const activeVoters = voters.filter((v) => v.is_active !== false);
    const memberStatusMap = new Map(
      members.map((m) => [m.voter_id, m.trip_status]),
    );
    const hasAnyMembers = members.length > 0;

    const onTrip = activeVoters.filter((v) => {
      const status = memberStatusMap.get(v.voter_id);
      return hasAnyMembers ? status === "on_trip" : true;
    });

    const remote = activeVoters.filter((v) =>
      memberStatusMap.get(v.voter_id) === "remote",
    );

    return {
      onTripVoters: onTrip,
      remoteVoters: remote,
      onTripCount: onTrip.length,
    };
  }, [voters, members]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4">
        <div className="pt-6 pb-4">
          <div className="h-48 animate-pulse rounded-card bg-raised" />
        </div>
        <div className="flex gap-3 overflow-hidden py-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-20 min-w-[120px] flex-none animate-pulse rounded-card bg-raised"
            />
          ))}
        </div>
        <div className="flex gap-2 py-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="h-16 w-16 flex-none animate-pulse rounded-full bg-raised"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-[calc(64px+env(safe-area-inset-bottom))]">
      {/* Trip Status Hero */}
      <div className="px-4 pt-6 pb-4">
        {effectiveStatus === "planning" && (
          <div className="card border p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <Icon name="edit_location_alt" size={40} className="text-ink-dim" />
              <h2 className="text-display text-ink">Planning Mode</h2>
              <p className="text-base text-ink-muted">
                Vote on a city and dates to get the trip started.
              </p>
              <button
                type="button"
                onClick={() => router.push("/plan/cities")}
                className="btn-ghost mt-2"
              >
                Go to Cities &rarr;
              </button>
            </div>
          </div>
        )}

        {effectiveStatus === "upcoming" && (
          <div
            className="card border p-6"
            style={{ borderColor: "var(--accent)" }}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <Icon name="location_on" size={40} className="text-accent" />
              <h2 className="text-display text-ink">{cityName}</h2>
              {trip?.start_date && trip?.end_date && (
                <p className="text-title text-ink-muted">
                  {formatShortDate(trip.start_date)} &rarr;{" "}
                  {formatShortDate(trip.end_date)}
                </p>
              )}
              <div className="py-2">
                {daysUntil !== null && daysUntil > 1 && (
                  <p className="text-display text-accent">
                    {daysUntil} days away
                  </p>
                )}
                {daysUntil === 1 && (
                  <p className="text-display text-accent">Tomorrow!</p>
                )}
                {daysUntil === 0 && (
                  <p className="text-display text-green">Today!</p>
                )}
              </div>
              {hotels.length > 0 && (
                <button
                  type="button"
                  onClick={() => router.push("/plan/board")}
                  className="text-meta text-ink-muted transition hover:text-ink"
                >
                  Hotels: {hotels.length} confirmed
                </button>
              )}
            </div>
          </div>
        )}

        {effectiveStatus === "active" && (
          <div
            className="card border p-6"
            style={{
              background: "var(--green-dim)",
              borderColor: "var(--green)",
            }}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <Icon name="sports_bar" size={40} className="text-green" />
              <h2 className="text-display text-green">
                We&apos;re on the trip!
              </h2>
              {cityName && (
                <p className="text-title text-ink-muted">{cityName}</p>
              )}
              {trip?.start_date && trip?.end_date && (
                <p className="text-title text-ink-muted">
                  {formatShortDate(trip.start_date)} &rarr;{" "}
                  {formatShortDate(trip.end_date)}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setLastWing("social");
                  router.push("/social");
                }}
                className="btn-accent mt-3 w-full"
              >
                Open Hopp &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div
        className="flex gap-3 overflow-x-auto px-4 py-4"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex min-w-[120px] flex-none flex-col rounded-card border bg-surface px-4 py-3">
          <span className="text-display text-accent">{totalVotes}</span>
          <span className="text-meta text-ink-muted">votes cast</span>
        </div>
        <div className="flex min-w-[120px] flex-none flex-col rounded-card border bg-surface px-4 py-3">
          <span className="truncate text-title text-ink">
            {ranking[0]?.city.name ?? "None yet"}
          </span>
          <span className="text-meta text-ink-muted">leading city</span>
        </div>
        <div className="flex min-w-[120px] flex-none flex-col rounded-card border bg-surface px-4 py-3">
          <span className="text-title text-ink">
            {bestDate ? formatShortDate(bestDate.date) : "TBD"}
          </span>
          <span className="text-meta text-ink-muted">best date</span>
        </div>
        <div className="flex min-w-[120px] flex-none flex-col rounded-card border bg-surface px-4 py-3">
          <span className="text-display text-green">{onTripCount}</span>
          <span className="text-meta text-ink-muted">on the trip</span>
        </div>
      </div>

      {/* Who's In */}
      <div className="px-4">
        <div className="flex items-center justify-between">
          <h3 className="text-title font-bold text-ink">Who&apos;s In</h3>
          <span className="text-meta text-ink-muted">{onTripCount} going</span>
        </div>

        {onTripVoters.length === 0 && remoteVoters.length === 0 ? (
          <p className="py-3 text-meta text-ink-muted">
            No crew yet — share the app with your crew.
          </p>
        ) : (
          <>
            <div
              className="flex gap-2 overflow-x-auto py-3"
              style={{ scrollbarWidth: "none" }}
            >
              {onTripVoters.map((v) => (
                <button
                  key={v.voter_id}
                  type="button"
                  onClick={() => router.push("/plan/hopperz")}
                  className="flex flex-none flex-col items-center gap-1"
                >
                  <Avatar voter={v} size={44} />
                  <span className="w-11 truncate text-center text-[11px] text-ink-muted">
                    {v.display_name ?? v.name}
                  </span>
                </button>
              ))}
            </div>

            {remoteVoters.length > 0 && (
              <div
                className="flex gap-2 overflow-x-auto pb-3"
                style={{ scrollbarWidth: "none" }}
              >
                {remoteVoters.map((v) => (
                  <button
                    key={v.voter_id}
                    type="button"
                    onClick={() => router.push("/plan/hopperz")}
                    className="flex flex-none flex-col items-center gap-1"
                  >
                    <span className="relative">
                      <Avatar voter={v} size={44} />
                      <span
                        className="absolute bottom-0 right-0 flex items-center justify-center rounded-full bg-surface"
                        style={{ width: 14, height: 14 }}
                      >
                        <Icon name="wifi" size={10} className="text-accent" />
                      </span>
                    </span>
                    <span className="w-11 truncate text-center text-[11px] text-ink-muted">
                      {v.display_name ?? v.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4">
        <h3 className="pb-2 text-label font-semibold text-ink-muted">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => router.push("/plan/cities")}
            className="card flex min-h-[88px] flex-col items-center justify-center gap-2 transition hover:bg-raised"
          >
            <Icon
              name="how_to_vote"
              size={28}
              className={hasVoted ? "text-green" : "text-accent"}
            />
            <span
              className={`text-meta font-semibold ${hasVoted ? "text-green" : "text-ink"}`}
            >
              {hasVoted ? "Vote Cast ✓" : "Cast Your Vote"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/plan/calendar")}
            className="card flex min-h-[88px] flex-col items-center justify-center gap-2 transition hover:bg-raised"
          >
            <Icon
              name="event_available"
              size={28}
              className={hasMarkedDates ? "text-green" : "text-accent"}
            />
            <span
              className={`text-meta font-semibold ${hasMarkedDates ? "text-green" : "text-ink"}`}
            >
              {hasMarkedDates ? "Dates Marked ✓" : "Mark Dates"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/social")}
            className="card relative flex min-h-[88px] flex-col items-center justify-center gap-2 transition hover:bg-raised"
          >
            <span className="relative">
              <Icon name="chat_bubble" size={28} className="text-accent" />
              {unreadCount > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-bg">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            <span className="text-meta font-semibold text-ink">Open Chat</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/social/locate")}
            className="card flex min-h-[88px] flex-col items-center justify-center gap-2 transition hover:bg-raised"
          >
            <Icon name="person_pin" size={28} className="text-accent" />
            <span className="text-meta font-semibold text-ink">
              Find the Crew
            </span>
          </button>
        </div>
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
