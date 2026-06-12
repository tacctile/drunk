"use client";

import { useEffect, useState } from "react";
import type { City, VenueKind } from "@/data/types";
import { loadGoogleMaps } from "@/lib/maps";
import { getSupabase, type DbVenueRow } from "@/lib/supabase";
import { EMPTY_VENUES, formatTypes, isChain, type CityVenues, type Venue } from "@/lib/venues";

// Nearby Search parameters per category (radius in meters, rank by prominence).
const SEARCHES: Record<VenueKind, { type: string; radius: number; table: string }> = {
  hotel: { type: "lodging", radius: 2000, table: "v2_hotels" },
  bar: { type: "bar", radius: 1000, table: "v2_bars" },
  food: { type: "restaurant", radius: 800, table: "v2_food" },
};

function nearby(
  service: google.maps.places.PlacesService,
  request: google.maps.places.PlaceSearchRequest,
): Promise<google.maps.places.PlaceResult[]> {
  return new Promise((resolve) => {
    try {
      service.nearbySearch(request, (results, status) => {
        const ok = status === google.maps.places.PlacesServiceStatus.OK;
        resolve(ok && results ? results : []);
      });
    } catch {
      resolve([]);
    }
  });
}

function toVenue(kind: VenueKind, place: google.maps.places.PlaceResult): Venue | null {
  if (!place.place_id || !place.name) return null;
  if (place.business_status && place.business_status !== "OPERATIONAL") return null;
  if (kind !== "hotel" && isChain(place.name)) return null;
  const loc = place.geometry?.location;
  return {
    id: place.place_id,
    kind,
    name: place.name,
    address: place.vicinity ?? place.formatted_address ?? "",
    coords: loc ? { lat: loc.lat(), lng: loc.lng() } : null,
    rating: place.rating ?? null,
    ratingCount: place.user_ratings_total ?? null,
    priceLevel: place.price_level ?? null,
    priceText: null,
    descriptor: formatTypes(place.types),
  };
}

/** Curated Supabase rows for one category — the silent fallback. */
async function fromSupabase(kind: VenueKind, cityId: string): Promise<Venue[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from(SEARCHES[kind].table)
      .select("id,city_id,name,address,descriptor" + (kind === "hotel" ? ",stars,price_range" : ""))
      .eq("city_id", cityId);
    if (error || !data) return [];
    return (data as unknown as DbVenueRow[]).map((row) => ({
      id: row.id,
      kind,
      name: row.name,
      address: row.address ?? "",
      coords: null,
      rating: row.stars ?? null,
      ratingCount: null,
      priceLevel: null,
      priceText: row.price_range ?? null,
      descriptor: row.descriptor ?? "",
    }));
  } catch {
    return [];
  }
}

async function fetchCategory(
  service: google.maps.places.PlacesService | null,
  center: google.maps.LatLngLiteral,
  kind: VenueKind,
  cityId: string,
): Promise<Venue[]> {
  if (service) {
    const results = await nearby(service, {
      location: center,
      radius: SEARCHES[kind].radius,
      type: SEARCHES[kind].type,
    });
    const venues = results
      .map((p) => toVenue(kind, p))
      .filter((v): v is Venue => v !== null);
    if (venues.length > 0) return venues;
  }
  return fromSupabase(kind, cityId);
}

async function fetchCityVenues(city: City): Promise<CityVenues> {
  let service: google.maps.places.PlacesService | null = null;
  try {
    const g = await loadGoogleMaps();
    service = new g.maps.places.PlacesService(document.createElement("div"));
  } catch {
    service = null; // Maps unavailable — Supabase fallback below
  }
  const [hotel, bar, food] = await Promise.all(
    (["hotel", "bar", "food"] as const).map((kind) =>
      fetchCategory(service, city.mapCenter, kind, city.id),
    ),
  );
  return { hotel, bar, food };
}

// One fetch per city per session — results don't change under the user's feet.
const cache = new Map<string, Promise<CityVenues>>();

export interface PlacesView {
  venues: CityVenues;
  /** False until the first result (or fallback) settles. */
  ready: boolean;
}

export function usePlaces(city: City): PlacesView {
  const [state, setState] = useState<{ cityId: string; venues: CityVenues; ready: boolean }>({
    cityId: city.id,
    venues: EMPTY_VENUES,
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;
    let promise = cache.get(city.id);
    if (!promise) {
      promise = fetchCityVenues(city);
      cache.set(city.id, promise);
    }
    promise.then(
      (venues) => {
        if (!cancelled) setState({ cityId: city.id, venues, ready: true });
      },
      () => {
        cache.delete(city.id);
        if (!cancelled) setState({ cityId: city.id, venues: EMPTY_VENUES, ready: true });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [city]);

  if (state.cityId !== city.id) return { venues: EMPTY_VENUES, ready: false };
  return { venues: state.venues, ready: state.ready };
}
