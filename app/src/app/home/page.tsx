"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { setLastWing } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { formatShortDate } from "@/lib/format";
import { getInitials } from "@/lib/colors";
import { useTripData } from "@/hooks/useTripData";
import { useVotes } from "@/hooks/useVotes";
import { useAvailability } from "@/hooks/useAvailability";
import { useGroupData } from "@/hooks/useGroupData";
import {
  TripHeroCard,
  HorizontalScroll,
  StatTile,
  AvatarChip,
  QuickActionCard,
  BottomNav,
  BottomNavItem,
  SectionLabel,
  Card,
} from "@hoppz-ui";

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
          <div className="h-48 animate-pulse rounded-xl bg-surface-container-high" />
        </div>
        <div className="flex gap-3 overflow-hidden py-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-20 min-w-[120px] flex-none animate-pulse rounded-xl bg-surface-container-high"
            />
          ))}
        </div>
        <div className="flex gap-2 py-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="h-16 w-16 flex-none animate-pulse rounded-full bg-surface-container-high"
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
          <Card className="p-6">
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
          </Card>
        )}

        {effectiveStatus === "upcoming" && (
          <>
            <TripHeroCard
              label="Trip"
              destination={cityName ?? ""}
              countdownValue={
                daysUntil === 0
                  ? "Today!"
                  : daysUntil === 1
                    ? "Tomorrow!"
                    : daysUntil !== null
                      ? String(daysUntil)
                      : ""
              }
              countdownLabel={daysUntil !== null && daysUntil > 1 ? "days away" : ""}
              dateRange={
                trip?.start_date && trip?.end_date
                  ? `${formatShortDate(trip.start_date)} → ${formatShortDate(trip.end_date)}`
                  : undefined
              }
              dateIcon="calendar_month"
              accentClassName="border-l-accent"
            />
            {hotels.length > 0 && (
              <button
                type="button"
                onClick={() => router.push("/plan/board")}
                className="mt-2 text-meta text-ink-muted transition hover:text-ink"
              >
                Hotels: {hotels.length} confirmed
              </button>
            )}
          </>
        )}

        {effectiveStatus === "active" && (
          <>
            <TripHeroCard
              label="Active Trip"
              destination={cityName ?? "We're on the trip!"}
              countdownValue=""
              countdownLabel=""
              dateRange={
                trip?.start_date && trip?.end_date
                  ? `${formatShortDate(trip.start_date)} → ${formatShortDate(trip.end_date)}`
                  : undefined
              }
              dateIcon="calendar_month"
              accentClassName="border-l-green"
            />
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
          </>
        )}
      </div>

      {/* Quick Stats Row */}
      <HorizontalScroll className="px-4 py-4">
        <StatTile
          icon="how_to_vote"
          value={String(totalVotes)}
          label="votes cast"
          iconClassName="text-accent"
        />
        <StatTile
          icon="location_city"
          value={ranking[0]?.city.name ?? "None yet"}
          label="leading city"
        />
        <StatTile
          icon="event"
          value={bestDate ? formatShortDate(bestDate.date) : "TBD"}
          label="best date"
        />
        <StatTile
          icon="group"
          value={String(onTripCount)}
          label="on the trip"
          iconClassName="text-green"
        />
      </HorizontalScroll>

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
            <HorizontalScroll className="py-3">
              {onTripVoters.map((v) => (
                <AvatarChip
                  key={v.voter_id}
                  name={(v.display_name ?? v.name).split(" ")[0]}
                  initials={getInitials(v.display_name ?? v.name)}
                  active
                  onClick={() => router.push("/plan/hopperz")}
                />
              ))}
            </HorizontalScroll>

            {remoteVoters.length > 0 && (
              <HorizontalScroll className="pb-3">
                {remoteVoters.map((v) => (
                  <AvatarChip
                    key={v.voter_id}
                    name={(v.display_name ?? v.name).split(" ")[0]}
                    initials={getInitials(v.display_name ?? v.name)}
                    icon="wifi"
                    onClick={() => router.push("/plan/hopperz")}
                  />
                ))}
              </HorizontalScroll>
            )}
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4">
        <div className="pb-2">
          <SectionLabel>Quick Actions</SectionLabel>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionCard
            icon="how_to_vote"
            label={hasVoted ? "Vote Cast ✓" : "Cast Your Vote"}
            iconClassName={hasVoted ? "text-green" : "text-accent"}
            onClick={() => router.push("/plan/cities")}
          />

          <QuickActionCard
            icon="event_available"
            label={hasMarkedDates ? "Dates Marked ✓" : "Mark Dates"}
            iconClassName={hasMarkedDates ? "text-green" : "text-accent"}
            onClick={() => router.push("/plan/calendar")}
          />

          <div className="relative">
            <QuickActionCard
              icon="chat_bubble"
              label="Open Chat"
              iconClassName="text-accent"
              onClick={() => router.push("/social")}
            />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-bg">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <QuickActionCard
            icon="person_pin"
            label="Find the Crew"
            iconClassName="text-accent"
            onClick={() => router.push("/social/locate")}
          />
        </div>
      </div>

      {/* Home Bottom Bar */}
      <BottomNav fixed elevated>
        <BottomNavItem
          icon="map"
          label="Plan"
          fill
          onClick={() => {
            setLastWing("plan");
            router.push("/plan");
          }}
        />
        <BottomNavItem
          icon="sports_bar"
          label="Hopp"
          fill
          onClick={() => {
            setLastWing("social");
            router.push("/social");
          }}
        />
      </BottomNav>
    </div>
  );
}
