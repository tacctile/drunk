"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabase, safeSelect } from "@/lib/supabase";
import type {
  TripRow,
  TripHotelRow,
  TripHotelAssignmentRow,
  TripMemberRow,
  TripStatus,
  TripMemberStatus,
} from "@/lib/supabase";
import { cityById } from "@/data/cities";

export interface TripHotelWithAssignments extends TripHotelRow {
  assignedVoterIds: string[];
}

export interface TripView {
  trip: TripRow | null;
  hotels: TripHotelWithAssignments[];
  members: TripMemberRow[];
  loading: boolean;
  effectiveStatus: TripStatus;
  cityName: string | null;
  daysUntil: number | null;
  setTripDates: (startDate: string, endDate: string) => Promise<void>;
  setTripCity: (cityId: string) => Promise<void>;
  clearTripDates: () => Promise<void>;
  addHotel: (hotelName: string) => Promise<void>;
  removeHotel: (hotelId: string) => Promise<void>;
  assignVoterToHotel: (voterId: string, hotelId: string) => Promise<void>;
  unassignVoterFromHotel: (voterId: string, hotelId: string) => Promise<void>;
  setMemberStatus: (voterId: string, status: TripMemberStatus) => Promise<void>;
  syncTripStatus: () => Promise<void>;
}

export function useTrip(): TripView {
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [hotels, setHotels] = useState<TripHotelRow[]>([]);
  const [assignments, setAssignments] = useState<TripHotelAssignmentRow[]>([]);
  const [members, setMembers] = useState<TripMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const tripRef = useRef(trip);
  tripRef.current = trip;

  const refetch = useCallback(async () => {
    const [tripData, hotelsData, assignmentsData, membersData] = await Promise.all([
      safeSelect<TripRow>("v2_trip", "*"),
      safeSelect<TripHotelRow>("v2_trip_hotels", "*"),
      safeSelect<TripHotelAssignmentRow>("v2_trip_hotel_assignments", "*"),
      safeSelect<TripMemberRow>("v2_trip_members", "*"),
    ]);
    const t = tripData?.[0] ?? null;
    setTrip(t);
    tripRef.current = t;
    if (hotelsData) setHotels(hotelsData);
    if (assignmentsData) setAssignments(assignmentsData);
    if (membersData) setMembers(membersData);
    setLoading(false);
  }, []);

  const syncTripStatus = useCallback(async () => {
    const t = tripRef.current;
    if (!t) return;
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    let newStatus: TripStatus = t.status;

    if (t.start_date && t.end_date && t.city_id) {
      if (today >= t.start_date && today <= t.end_date) {
        newStatus = "active";
      } else if (today < t.start_date) {
        newStatus = "upcoming";
      } else if (today > t.end_date) {
        newStatus = "planning";
      }
    } else {
      newStatus = "planning";
    }

    if (newStatus !== t.status) {
      const sb = getSupabase();
      if (!sb) return;
      const patch: Partial<TripRow> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === "planning") {
        patch.start_date = null;
        patch.end_date = null;
        patch.city_id = null;
      }
      await sb.from("v2_trip").update(patch).eq("id", t.id);
      setTrip((prev) => (prev ? { ...prev, ...patch } : prev));
    }
  }, []);

  useEffect(() => {
    void refetch().then(() => void syncTripStatus());

    const sb = getSupabase();
    let channel: ReturnType<NonNullable<typeof sb>["channel"]> | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const queueRefetch = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refetch(), 250);
    };
    if (sb) {
      try {
        channel = sb.channel("hoppz-trip");
        for (const table of [
          "v2_trip",
          "v2_trip_hotels",
          "v2_trip_hotel_assignments",
          "v2_trip_members",
        ]) {
          channel.on("postgres_changes", { event: "*", schema: "public", table }, queueRefetch);
        }
        channel.subscribe();
      } catch {
        channel = null;
      }
    }

    const onFocus = () => {
      void refetch().then(() => void syncTripStatus());
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      if (timer) clearTimeout(timer);
      if (channel && sb) void sb.removeChannel(channel);
    };
  }, [refetch, syncTripStatus]);

  const effectiveStatus = useMemo((): TripStatus => {
    if (!trip?.start_date || !trip?.end_date || !trip?.city_id) return "planning";
    const today = new Date().toISOString().split("T")[0];
    if (today >= trip.start_date && today <= trip.end_date) return "active";
    if (today < trip.start_date) return "upcoming";
    return "planning";
  }, [trip]);

  const daysUntil = useMemo((): number | null => {
    if (!trip?.start_date) return null;
    const start = new Date(trip.start_date);
    const now = new Date();
    const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [trip]);

  const cityName = useMemo((): string | null => {
    if (!trip?.city_id) return null;
    return cityById(trip.city_id)?.name ?? null;
  }, [trip]);

  const hotelsWithAssignments = useMemo(
    () =>
      hotels
        .map((h) => ({
          ...h,
          assignedVoterIds: assignments
            .filter((a) => a.trip_hotel_id === h.id)
            .map((a) => a.voter_id),
        }))
        .sort((a, b) => a.sort_order - b.sort_order),
    [hotels, assignments],
  );

  const setTripDates = useCallback(
    async (startDate: string, endDate: string) => {
      if (startDate > endDate) return;
      const now = new Date().toISOString();
      setTrip((prev) => (prev ? { ...prev, start_date: startDate, end_date: endDate, updated_at: now } : prev));
      const sb = getSupabase();
      if (!sb || !trip) return;
      try {
        await sb
          .from("v2_trip")
          .update({ start_date: startDate, end_date: endDate, updated_at: now })
          .eq("id", trip.id);
      } catch {
        // silent
      }
      void syncTripStatus();
    },
    [trip, syncTripStatus],
  );

  const setTripCity = useCallback(
    async (cityId: string) => {
      const now = new Date().toISOString();
      setTrip((prev) => (prev ? { ...prev, city_id: cityId, updated_at: now } : prev));
      const sb = getSupabase();
      if (!sb || !trip) return;
      try {
        await sb.from("v2_trip").update({ city_id: cityId, updated_at: now }).eq("id", trip.id);
      } catch {
        // silent
      }
    },
    [trip],
  );

  const clearTripDates = useCallback(async () => {
    const now = new Date().toISOString();
    setTrip((prev) =>
      prev
        ? { ...prev, start_date: null, end_date: null, city_id: null, status: "planning" as TripStatus, updated_at: now }
        : prev,
    );
    const sb = getSupabase();
    if (!sb || !trip) return;
    try {
      await sb
        .from("v2_trip")
        .update({
          start_date: null,
          end_date: null,
          city_id: null,
          status: "planning",
          updated_at: now,
        })
        .eq("id", trip.id);
    } catch {
      // silent
    }
  }, [trip]);

  const addHotel = useCallback(
    async (hotelName: string) => {
      if (!trip) return;
      const id = crypto.randomUUID();
      const row: TripHotelRow = {
        id,
        trip_id: trip.id,
        hotel_name: hotelName,
        sort_order: hotels.length,
        created_at: new Date().toISOString(),
      };
      setHotels((prev) => [...prev, row]);
      const sb = getSupabase();
      if (!sb) return;
      try {
        await sb.from("v2_trip_hotels").insert(row);
      } catch {
        // silent
      }
    },
    [trip, hotels.length],
  );

  const removeHotel = useCallback(async (hotelId: string) => {
    setHotels((prev) => prev.filter((h) => h.id !== hotelId));
    setAssignments((prev) => prev.filter((a) => a.trip_hotel_id !== hotelId));
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from("v2_trip_hotels").delete().eq("id", hotelId);
    } catch {
      // silent
    }
  }, []);

  const assignVoterToHotel = useCallback(async (voterId: string, hotelId: string) => {
    setAssignments((prev) => [
      ...prev.filter((a) => a.voter_id !== voterId),
      { voter_id: voterId, trip_hotel_id: hotelId },
    ]);
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from("v2_trip_hotel_assignments").delete().eq("voter_id", voterId);
      await sb.from("v2_trip_hotel_assignments").insert({ voter_id: voterId, trip_hotel_id: hotelId });
    } catch {
      // silent
    }
  }, []);

  const unassignVoterFromHotel = useCallback(async (voterId: string, hotelId: string) => {
    setAssignments((prev) =>
      prev.filter((a) => !(a.voter_id === voterId && a.trip_hotel_id === hotelId)),
    );
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb
        .from("v2_trip_hotel_assignments")
        .delete()
        .eq("voter_id", voterId)
        .eq("trip_hotel_id", hotelId);
    } catch {
      // silent
    }
  }, []);

  const setMemberStatus = useCallback(async (voterId: string, status: TripMemberStatus) => {
    const now = new Date().toISOString();
    setMembers((prev) => {
      const next = prev.filter((m) => m.voter_id !== voterId);
      next.push({ voter_id: voterId, trip_status: status, updated_at: now });
      return next;
    });
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb
        .from("v2_trip_members")
        .upsert({ voter_id: voterId, trip_status: status, updated_at: now }, { onConflict: "voter_id" });
    } catch {
      // silent
    }
  }, []);

  return {
    trip,
    hotels: hotelsWithAssignments,
    members,
    loading,
    effectiveStatus,
    cityName,
    daysUntil,
    setTripDates,
    setTripCity,
    clearTripDates,
    addHotel,
    removeHotel,
    assignVoterToHotel,
    unassignVoterFromHotel,
    setMemberStatus,
    syncTripStatus,
  };
}
