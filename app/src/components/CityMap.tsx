"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { City, Coords, VenueKind } from "@/data/types";
import { contrastColor, getInitials } from "@/lib/colors";
import { getStoredName, getStoredPinColor } from "@/lib/identity";
import { BASE_MAP_OPTIONS, DARK_MAP_STYLE, PIN_COLORS, loadGoogleMaps } from "@/lib/maps";
import type { CityVenues, Venue } from "@/lib/venues";
import { Icon } from "./Icon";

interface CityMapProps {
  city: City;
  venues: CityVenues;
  onPinTap: (venue: Venue) => void;
}

/** Imperative surface for the venue rows below the map. */
export interface CityMapHandle {
  /** Pan/zoom to a venue's pin and highlight it. No-op when it has no coords. */
  focusVenue: (venue: Venue) => void;
}

// Venue pins are 18px filled circles; the focused one grows to 26px with a
// heavier stroke; your own dot sits between them at 22px, above everything.
const VENUE_PIN_SCALE = 9;
const FOCUS_PIN_SCALE = 13;
const YOU_PIN_SCALE = 11;
const VENUE_PIN_Z = 10;
const FOCUS_PIN_Z = 11; // the focused pin draws over its neighbors
const YOU_PIN_Z = 20; // your dot draws over every venue pin
const FOCUS_ZOOM = 16; // a tapped venue (and the frame for a lone pin)
const FIT_PADDING = 60; // px kept around the fitted bounds
// Pin-name labels only show once the map is zoomed in to street level.
const LABEL_MIN_ZOOM = 15;
// Horizontal gap between the pin center and its label (clears an 18px pin).
const LABEL_GAP = 14;
// The city-detail sticky header is 56px + hairline — scrollIntoView lands
// the map just below it instead of underneath it.
const HEADER_CLEARANCE = 57;

function venuePinIcon(kind: VenueKind, focused: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: focused ? FOCUS_PIN_SCALE : VENUE_PIN_SCALE,
    fillColor: PIN_COLORS[kind],
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: focused ? 3 : 2,
  };
}

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
  venue: Venue;
  marker: google.maps.Marker;
  label: google.maps.OverlayView;
}

/**
 * The city detail map. Live Google Map, dark style, venue pins as filled
 * 18px circles with a white 2px stroke — hotels accent, bars green, food
 * blue — plus zoom-gated name labels. Coordinates come straight from the
 * curated lat/lng columns; null = no pin. Pin tap opens the venue sheet;
 * a venue-row tap (via the focusVenue handle) pans to that pin and grows
 * it; the floating Show All button re-frames every venue pin. Once the
 * map mounts, watchPosition drops your own dot in your assigned pin color
 * with your initials — denied permission is silent. If Maps can't load,
 * the container stays a quiet surface — never an error.
 */
export const CityMap = forwardRef<CityMapHandle, CityMapProps>(function CityMap(
  { city, venues, onPinTap },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const overlaysRef = useRef<Map<string, PinOverlays>>(new Map());
  const focusedIdRef = useRef<string | null>(null);
  const didFitRef = useRef(false);
  const tapRef = useRef(onPinTap);
  tapRef.current = onPinTap;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !elRef.current) return;
        focusedIdRef.current = null;
        didFitRef.current = false;
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

  /** Re-style every pin: the focused one big and heavy, the rest back to base. */
  const applyFocus = useCallback((id: string | null) => {
    focusedIdRef.current = id;
    for (const [venueId, pin] of overlaysRef.current) {
      const focused = venueId === id;
      pin.marker.setIcon(venuePinIcon(pin.venue.kind, focused));
      pin.marker.setZIndex(focused ? FOCUS_PIN_Z : VENUE_PIN_Z);
    }
  }, []);

  /**
   * Frame every venue pin with padding. A single pin pans instead —
   * fitBounds around one point zooms in absurdly far. Your own location
   * dot is deliberately not part of the bounds.
   */
  const fitAllPins = useCallback((target: google.maps.Map) => {
    const positions: google.maps.LatLng[] = [];
    for (const pin of overlaysRef.current.values()) {
      const pos = pin.marker.getPosition();
      if (pos) positions.push(pos);
    }
    if (positions.length === 0) return;
    if (positions.length === 1) {
      target.panTo(positions[0]);
      target.setZoom(FOCUS_ZOOM);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const pos of positions) bounds.extend(pos);
    target.fitBounds(bounds, FIT_PADDING);
  }, []);

  // Diffed pins, keyed by venue id. A venue with null lat/lng simply has no
  // pin — its coordinates come from the curated lat/lng columns, never from
  // geocoding. A sparse map until coords are backfilled is expected.
  useEffect(() => {
    if (!map) return;
    const overlays = overlaysRef.current;
    const wanted = new Map<string, Venue>();
    for (const venue of [...venues.hotel, ...venues.bar, ...venues.food]) {
      if (venue.lat != null && venue.lng != null) wanted.set(venue.id, venue);
    }
    for (const [id, pin] of overlays) {
      if (wanted.has(id)) continue;
      pin.marker.setMap(null);
      pin.label.setMap(null);
      overlays.delete(id);
    }
    for (const venue of wanted.values()) {
      if (overlays.has(venue.id) || venue.lat == null || venue.lng == null) continue;
      const coords: Coords = { lat: venue.lat, lng: venue.lng };
      const focused = venue.id === focusedIdRef.current;
      const marker = new google.maps.Marker({
        map,
        position: coords,
        title: venue.name,
        icon: venuePinIcon(venue.kind, focused),
        zIndex: focused ? FOCUS_PIN_Z : VENUE_PIN_Z,
      });
      marker.addListener("click", () => tapRef.current(venue));
      const label = createPinLabel(venue.name, coords);
      label.setMap(map);
      overlays.set(venue.id, { venue, marker, label });
    }
    // First placement: frame every pin so all of them are visible. No pins
    // at all (coords not yet backfilled) keeps the city's own center/zoom.
    if (!didFitRef.current && overlays.size > 0) {
      didFitRef.current = true;
      fitAllPins(map);
    }
  }, [map, venues, fitAllPins]);

  // Your own dot. watchPosition starts when the map mounts — the only place
  // in the app that requests location permission outside an explicit sharing
  // toggle — and keeps the dot moving with you. The first fix creates the
  // marker (assigned pin color, your initials, "You" on hover); denied or
  // unavailable is silent: no pin, no error, no retry prompt.
  useEffect(() => {
    if (!map) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const pinColor = getStoredPinColor() ?? "#FF8C42";
    const initials = getInitials(getStoredName());
    let youMarker: google.maps.Marker | null = null;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (youMarker) {
          youMarker.setPosition(here);
          return;
        }
        youMarker = new google.maps.Marker({
          map,
          position: here,
          title: "You",
          zIndex: YOU_PIN_Z,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: YOU_PIN_SCALE,
            fillColor: pinColor,
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2.5,
          },
          label: initials
            ? {
                text: initials,
                color: contrastColor(pinColor),
                fontSize: "10px",
                fontWeight: "700",
              }
            : undefined,
        });
      },
      () => {
        // permission denied or no fix — silent by design
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 },
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
      youMarker?.setMap(null);
    };
  }, [map]);

  useImperativeHandle(
    ref,
    () => ({
      focusVenue(venue: Venue) {
        if (!map || venue.lat == null || venue.lng == null) return;
        map.panTo({ lat: venue.lat, lng: venue.lng });
        map.setZoom(FOCUS_ZOOM);
        applyFocus(venue.id);
        // Only the map pans — "nearest" leaves the page alone unless the map
        // is outside the viewport, then scrolls just enough to reveal it.
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      },
    }),
    [map, applyFocus],
  );

  const handleShowAll = () => {
    if (!map) return;
    applyFocus(null);
    fitAllPins(map);
  };

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
    <div ref={containerRef} className="relative" style={{ scrollMarginTop: HEADER_CLEARANCE }}>
      <div
        ref={elRef}
        role="img"
        aria-label={`Map of ${city.district}, ${city.name}`}
        className="h-[280px] w-full bg-surface min-[600px]:h-[380px]"
      />
      {map && (
        <button
          type="button"
          onClick={handleShowAll}
          aria-label="Show all venues"
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-btn border bg-raised text-ink"
        >
          <Icon name="zoom_out_map" size={20} />
        </button>
      )}
    </div>
  );
});
