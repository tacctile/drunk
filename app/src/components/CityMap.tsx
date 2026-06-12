"use client";

import { useEffect, useRef, useState } from "react";
import type { City, Coords } from "@/data/types";
import { BASE_MAP_OPTIONS, DARK_MAP_STYLE, PIN_COLORS, loadGoogleMaps } from "@/lib/maps";
import type { CityVenues, Venue } from "@/lib/venues";

interface CityMapProps {
  city: City;
  venues: CityVenues;
  onPinTap: (venue: Venue) => void;
}

// Pin-name labels only show once the map is zoomed in to street level.
const LABEL_MIN_ZOOM = 15;
// Horizontal gap between the pin edge and its label.
const LABEL_GAP = 10;

/**
 * Venue-name pill beside a pin, as a custom OverlayView. Hidden below
 * LABEL_MIN_ZOOM; flips to the left of the pin when it would run off the
 * right edge of the map. Never intercepts pointer events.
 */
function createPinLabel(name: string, coords: Coords): google.maps.OverlayView {
  const div = document.createElement("div");
  div.textContent = name;
  div.style.cssText =
    "position:absolute;padding:2px 6px;border-radius:4px;" +
    "background:rgba(10,13,20,0.85);color:#e8ecf4;font-size:11px;" +
    "line-height:16px;white-space:nowrap;pointer-events:none;";

  const position = new google.maps.LatLng(coords.lat, coords.lng);
  const overlay = new google.maps.OverlayView();
  overlay.onAdd = () => {
    overlay.getPanes()?.floatPane.appendChild(div);
  };
  overlay.onRemove = () => {
    div.remove();
  };
  // draw() runs whenever the projection changes (zoom, pan), so both the
  // zoom gate and the edge flip stay current without extra listeners.
  overlay.draw = () => {
    const map = overlay.getMap() as google.maps.Map | null;
    const projection = overlay.getProjection();
    if (!map || !projection) return;
    if ((map.getZoom() ?? 0) < LABEL_MIN_ZOOM) {
      div.style.display = "none";
      return;
    }
    div.style.display = "";
    const point = projection.fromLatLngToDivPixel(position);
    const container = projection.fromLatLngToContainerPixel(position);
    if (!point || !container) return;
    const flip = container.x + LABEL_GAP + div.offsetWidth > map.getDiv().clientWidth;
    div.style.left = `${flip ? point.x - LABEL_GAP - div.offsetWidth : point.x + LABEL_GAP}px`;
    div.style.top = `${point.y - div.offsetHeight / 2}px`;
  };
  return overlay;
}

interface PinOverlays {
  marker: google.maps.Marker;
  label: google.maps.OverlayView;
}

/**
 * The city detail map. Live Google Map, dark style, venue pins as filled
 * 10px circles with a white 2px stroke — hotels accent, bars green, food
 * blue — plus zoom-gated name labels. Pin tap opens the venue sheet.
 * If Maps can't load, the container stays a quiet surface — never an error.
 */
export function CityMap({ city, venues, onPinTap }: CityMapProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const overlaysRef = useRef<Map<string, PinOverlays>>(new Map());
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

  // Diffed pins: venues gain coords one by one as geocoding resolves, so new
  // pins are added without tearing down the ones already on the map.
  useEffect(() => {
    if (!map) return;
    const overlays = overlaysRef.current;
    const wanted = new Map<string, Venue>();
    for (const venue of [...venues.hotel, ...venues.bar, ...venues.food]) {
      if (venue.coords) wanted.set(venue.id, venue);
    }
    for (const [id, pin] of overlays) {
      if (wanted.has(id)) continue;
      pin.marker.setMap(null);
      pin.label.setMap(null);
      overlays.delete(id);
    }
    for (const venue of wanted.values()) {
      if (overlays.has(venue.id) || !venue.coords) continue;
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
      const label = createPinLabel(venue.name, venue.coords);
      label.setMap(map);
      overlays.set(venue.id, { marker, label });
    }
  }, [map, venues]);

  // Clear every pin when the map instance goes away (city change, unmount).
  useEffect(() => {
    if (!map) return;
    const overlays = overlaysRef.current;
    return () => {
      for (const pin of overlays.values()) {
        pin.marker.setMap(null);
        pin.label.setMap(null);
      }
      overlays.clear();
    };
  }, [map]);

  return (
    <div
      ref={elRef}
      role="img"
      aria-label={`Map of ${city.district}, ${city.name}`}
      className="h-[280px] w-full bg-surface min-[600px]:h-[380px]"
    />
  );
}
