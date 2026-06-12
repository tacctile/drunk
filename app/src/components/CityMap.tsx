"use client";

import { useEffect, useRef, useState } from "react";
import type { City } from "@/data/types";
import { BASE_MAP_OPTIONS, DARK_MAP_STYLE, PIN_COLORS, loadGoogleMaps } from "@/lib/maps";
import type { CityVenues, Venue } from "@/lib/venues";

interface CityMapProps {
  city: City;
  venues: CityVenues;
  onPinTap: (venue: Venue) => void;
}

/**
 * The city detail map. Live Google Map, dark style, venue pins as filled
 * 10px circles with a white 2px stroke — hotels accent, bars green, food
 * blue. Pin tap opens the venue sheet. If Maps can't load, the container
 * stays a quiet surface — never an error.
 */
export function CityMap({ city, venues, onPinTap }: CityMapProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const tapRef = useRef(onPinTap);
  tapRef.current = onPinTap;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !elRef.current) return;
        setMap(
          new g.maps.Map(elRef.current, {
            ...BASE_MAP_OPTIONS,
            styles: DARK_MAP_STYLE,
            center: city.mapCenter,
            zoom: city.mapZoom,
          }),
        );
      })
      .catch(() => {
        // Maps unavailable — leave the quiet surface
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  useEffect(() => {
    if (!map) return;
    const markers: google.maps.Marker[] = [];
    for (const venue of [...venues.hotel, ...venues.bar, ...venues.food]) {
      if (!venue.coords) continue;
      const marker = new google.maps.Marker({
        map,
        position: venue.coords,
        title: venue.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: PIN_COLORS[venue.kind],
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => tapRef.current(venue));
      markers.push(marker);
    }
    markersRef.current = markers;
    return () => {
      for (const m of markers) m.setMap(null);
      markersRef.current = [];
    };
  }, [map, venues]);

  return (
    <div
      ref={elRef}
      role="img"
      aria-label={`Map of ${city.district}, ${city.name}`}
      className="h-[280px] w-full bg-surface min-[600px]:h-[380px]"
    />
  );
}
