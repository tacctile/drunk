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
  name: string;
}

export interface CityVoteRow {
  voter_id: string;
  city_id: string;
  updated_at: string;
}

export interface HotelVoteRow {
  voter_id: string;
  city_id: string;
  hotel_id: string;
  updated_at: string;
}

export interface AvailabilityRow {
  voter_id: string;
  date: string; // YYYY-MM-DD
  status: "available" | "unavailable";
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
