"use client";

import { useEffect, useRef, useState } from "react";
import type { City, Coords, VenueKind } from "@/data/types";
import { BASE_MAP_OPTIONS, DARK_MAP_STYLE, PIN_COLORS, loadGoogleMaps } from "@/lib/maps";
import { Icon } from "./Icon";

export interface MapVenue {
  id: string;
  name: string;
  kind: VenueKind;
  coords?: Coords;
}

export type MapFilter = "all" | VenueKind;

interface CityMapProps {
  city: City;
  /** Venue to spotlight (pan + enlarge pin); set by list taps and pin taps. */
  focusId: string | null;
  onPinTap: (venueId: string) => void;
  onCollapse: () => void;
}

const FILTERS: { id: MapFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "hotel", label: "Hotels" },
  { id: "bar", label: "Bars" },
  { id: "food", label: "Food" },
];

const LABEL_MIN_ZOOM = 15;
const SQUARE_PATH = "M -1 -1 L 1 -1 L 1 1 L -1 1 Z";

export function mapVenues(city: City): MapVenue[] {
  return [
    ...city.hotels.map((h) => ({ id: h.id, name: h.name, kind: "hotel" as const, coords: h.coords })),
    ...city.bars.map((b) => ({ id: b.id, name: b.name, kind: "bar" as const, coords: b.coords })),
    ...city.food.map((f) => ({ id: f.id, name: f.name, kind: "food" as const, coords: f.coords })),
  ];
}

/**
 * The live Google map — only ever mounted in the EXPANDED state; the
 * collapsed peek is the pure-SVG constellation. Dark style only. Pins share
 * the constellation's shape language and open the in-app venue sheet; there
 * is no external navigation anywhere.
 */
export function CityMap({ city, focusId, onPinTap, onCollapse }: CityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef(new Map<string, google.maps.Marker>());
  const labelsRef = useRef(new Map<string, { setMap: (m: google.maps.Map | null) => void }>());
  const labelsOnRef = useRef(false);
  const focusRef = useRef<string | null>(focusId);
  focusRef.current = focusId;
  const [filter, setFilter] = useState<MapFilter>("all");
  const [failed, setFailed] = useState(false);
  const venues = mapVenues(city);

  // Build the map + pins once per city.
  useEffect(() => {
    let cancelled = false;
    const markers = markersRef.current;
    const labels = labelsRef.current;

    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !containerRef.current) return;
        const map = new g.maps.Map(containerRef.current, {
          ...BASE_MAP_OPTIONS,
          center: city.mapCenter,
          zoom: city.mapZoom,
          styles: DARK_MAP_STYLE,
        });
        mapRef.current = map;

        // Custom OverlayView pin label, shown only when zoomed in.
        class PinLabel extends g.maps.OverlayView {
          private el: HTMLDivElement | null = null;
          constructor(
            private position: Coords,
            private text: string,
          ) {
            super();
          }
          onAdd() {
            this.el = document.createElement("div");
            this.el.textContent = this.text;
            this.el.style.cssText =
              "position:absolute;transform:translate(-50%,10px);pointer-events:none;" +
              "font:600 12px Manrope,sans-serif;letter-spacing:0.01em;white-space:nowrap;" +
              "color:#e8ecf4;text-shadow:0 1px 3px rgba(0,0,0,0.9);";
            this.getPanes()?.overlayLayer.appendChild(this.el);
          }
          draw() {
            const pt = this.getProjection()?.fromLatLngToDivPixel(
              new g.maps.LatLng(this.position.lat, this.position.lng),
            );
            if (pt && this.el) {
              this.el.style.left = `${pt.x}px`;
              this.el.style.top = `${pt.y}px`;
            }
          }
          onRemove() {
            this.el?.remove();
            this.el = null;
          }
        }

        const bounds = new g.maps.LatLngBounds();
        for (const v of venues) {
          if (!v.coords) continue;
          const marker = new g.maps.Marker({
            map,
            position: v.coords,
            title: v.name,
            icon: pinIcon(g, v.kind, v.id === focusRef.current),
          });
          marker.addListener("click", () => onPinTap(v.id));
          markers.set(v.id, marker);
          labels.set(v.id, new PinLabel(v.coords, v.name));
          bounds.extend(v.coords);
        }
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
        }

        // If a list row opened the map with a venue in mind, go straight there.
        const initialFocus = focusRef.current
          ? venues.find((v) => v.id === focusRef.current)
          : null;
        if (initialFocus?.coords) {
          map.setCenter(initialFocus.coords);
          map.setZoom(LABEL_MIN_ZOOM);
        }

        const syncLabels = () => {
          const show = (map.getZoom() ?? 0) >= LABEL_MIN_ZOOM;
          if (show === labelsOnRef.current) return;
          labelsOnRef.current = show;
          for (const l of labels.values()) l.setMap(show ? map : null);
        };
        map.addListener("zoom_changed", syncLabels);
        map.addListener("idle", syncLabels);
        syncLabels();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      for (const m of markers.values()) m.setMap(null);
      for (const l of labels.values()) l.setMap(null);
      markers.clear();
      labels.clear();
      labelsOnRef.current = false;
      mapRef.current = null;
    };
    // venues derive from city; rebuilding per city id is exactly what we want
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city.id, onPinTap]);

  // Category filter toggles pin visibility.
  useEffect(() => {
    for (const v of venues) {
      const m = markersRef.current.get(v.id);
      if (m) m.setVisible(filter === "all" || v.kind === filter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, city.id]);

  // Spotlight the focused venue: pan + enlarge its pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof google === "undefined") return;
    for (const v of venues) {
      const m = markersRef.current.get(v.id);
      if (!m) continue;
      m.setIcon(pinIcon(google, v.kind, v.id === focusId));
      m.setZIndex(v.id === focusId ? 1000 : undefined);
    }
    const focused = venues.find((v) => v.id === focusId);
    if (focused?.coords) {
      map.panTo(focused.coords);
      if ((map.getZoom() ?? 0) < LABEL_MIN_ZOOM) map.setZoom(LABEL_MIN_ZOOM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, city.id]);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={on}
                className={`chip ${on ? "chip-on" : ""}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Collapse map"
          className="flex h-11 w-11 flex-none items-center justify-center rounded text-muted transition hover:bg-raised hover:text-ink"
        >
          <Icon name="close_fullscreen" size={20} />
        </button>
      </div>
      <div className="card relative h-80 overflow-hidden min-[840px]:h-[420px]">
        <div ref={containerRef} className="h-full w-full" />
        {failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-raised text-muted">
            <Icon name="map" size={32} />
            <p className="text-sm font-semibold">Map couldn&apos;t load — the lists below still work.</p>
          </div>
        )}
      </div>
      <div className="mt-2 flex h-5 items-center gap-4">
        <LegendGlyph kind="hotel" label="Hotels" />
        <LegendGlyph kind="bar" label="Bars" />
        <LegendGlyph kind="food" label="Food" />
      </div>
    </div>
  );
}

/** Shape-coded pins: accent square, near-white dot, outlined muted circle. */
function pinIcon(g: typeof google, kind: VenueKind, focused: boolean): google.maps.Symbol {
  if (kind === "hotel") {
    return {
      path: SQUARE_PATH,
      fillColor: PIN_COLORS.hotel,
      fillOpacity: 1,
      strokeColor: "#0A0D14",
      strokeWeight: 1.5,
      scale: focused ? 7 : 5,
    };
  }
  if (kind === "bar") {
    return {
      path: g.maps.SymbolPath.CIRCLE,
      fillColor: PIN_COLORS.bar,
      fillOpacity: 1,
      strokeColor: "#0A0D14",
      strokeWeight: 1.5,
      scale: focused ? 9 : 6,
    };
  }
  return {
    path: g.maps.SymbolPath.CIRCLE,
    fillColor: PIN_COLORS.food,
    fillOpacity: 0,
    strokeColor: PIN_COLORS.food,
    strokeWeight: 2,
    scale: focused ? 8 : 5.5,
  };
}

function LegendGlyph({ kind, label }: { kind: VenueKind; label: string }) {
  return (
    <span className="label inline-flex items-center gap-1.5">
      {kind === "hotel" && <span className="inline-block h-2 w-2 bg-accent" aria-hidden />}
      {kind === "bar" && <span className="inline-block h-2 w-2 rounded-full bg-ink" aria-hidden />}
      {kind === "food" && (
        <span className="inline-block h-2 w-2 rounded-full border-2 border-muted" aria-hidden />
      )}
      {label}
    </span>
  );
}
