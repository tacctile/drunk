"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public client keys. Same values the root index.html ships; env vars take
// precedence so a Vercel deploy can rotate them without a code change.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://tszssadgsxjoymcttlwd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzenNzYWRnc3hqb3ltY3R0bHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMTE0NzQsImV4cCI6MjA5MzY4NzQ3NH0.FYdLejVlEFfCRluzsWMyQa7l7b-FJechgRXFcWl1MuE";

let client: SupabaseClient | null = null;

/**
 * Lazy singleton. Returns null when the client can't be constructed —
 * callers treat null exactly like a failed request and fall back to
 * localStorage. Supabase errors are never surfaced to users.
 */
export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (client) return client;
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
  } catch {
    client = null;
  }
  return client;
}

export interface VoterRow {
  voter_id: string;
  /** Kept for backward compat — same value as display_name for new rows. */
  name: string;
  /** "Nick B"; null on legacy rows created before the PIN system. */
  display_name: string | null;
}

export interface CityVoteRow {
  voter_id: string;
  city_id: string;
  updated_at: string;
}

export interface HotelVoteRow {
  voter_id: string;
  city_id: string;
  hotel_place_id: string; // v2_hotels row uuid (legacy rows may hold a Google place_id)
  hotel_name: string;
  updated_at: string;
}

/** Curated venue rows (v2_hotels / v2_bars / v2_food) — the canonical venue source. */
export interface DbVenueRow {
  id: string;
  city_id: string;
  name: string;
  address: string | null;
  descriptor: string | null;
  stars?: number | null; // v2_hotels only
  price_range?: string | null; // v2_hotels only
  distance_note?: string | null; // v2_hotels only
  has_food?: boolean | null; // v2_bars only
  has_bar?: boolean | null; // v2_food only
  lat?: number | null; // map pin coordinate; null/absent = no pin
  lng?: number | null;
}

export interface AvailabilityRow {
  voter_id: string;
  date: string; // YYYY-MM-DD
  status: "available" | "unavailable";
}

/** Live location shares (v2_locations) — one row per sharer, 72h lifetime. */
export interface LocationRow {
  voter_id: string;
  display_name: string;
  lat: number;
  lng: number;
  pin_color: string;
  sharing_since: string;
  expires_at: string;
  updated_at: string;
  /** Voters this sharer hides their pin from — one-directional, never disclosed. */
  muted_ids: string[];
}

/** Swallows all failures; returns null so callers can fall back silently. */
export async function safeSelect<T>(table: string, columns: string): Promise<T[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from(table).select(columns);
    if (error) return null;
    return (data as T[]) ?? [];
  } catch {
    return null;
  }
}
