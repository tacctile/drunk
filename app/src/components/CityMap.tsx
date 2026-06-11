"use client";

import { useEffect, useRef, useState } from "react";
import type { City, Coords, VenueKind } from "@/data/types";
import { BASE_MAP_OPTIONS, DARK_MAP_STYLE, LIGHT_MAP_STYLE, PIN_COLORS, loadGoogleMaps } from "@/lib/maps";
import { Icon } from "./Icon";
import { useTheme } from "./ThemeProvider";

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
}

const FILTERS: { id: MapFilter; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "stacks" },
  { id: "hotel", label: "Hotels", icon: "hotel" },
  { id: "bar", label: "Bars", icon: "sports_bar" },
  { id: "food", label: "Food", icon: "restaurant" },
];

const LABEL_MIN_ZOOM = 15;

export function mapVenues(city: City): MapVenue[] {
  return [
    ...city.hotels.map((h) => ({ id: h.id, name: h.name, kind: "hotel" as const, coords: h.coords })),
    ...city.bars.map((b) => ({ id: b.id, name: b.name, kind: "bar" as const, coords: b.coords })),
    ...city.food.map((f) => ({ id: f.id, name: f.name, kind: "food" as const, coords: f.coords })),
  ];
}

/**
 * In-app Google Map. No external navigation anywhere — pins open the in-app
 * venue sheet. Pin labels render through a custom OverlayView at zoom >= 15.
 */
export function CityMap({ city, focusId, onPinTap }: CityMapProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef(new Map<string, google.maps.Marker>());
  const labelsRef = useRef(new Map<string, { setMap: (m: google.maps.Map | null) => void }>());
  const labelsOnRef = useRef(false);
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
        const isDark = document.documentElement.classList.contains("dark");
        const map = new g.maps.Map(containerRef.current, {
          ...BASE_MAP_OPTIONS,
          center: city.mapCenter,
          zoom: city.mapZoom,
          styles: isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
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
              "position:absolute;transform:translate(-50%,9px);pointer-events:none;" +
              "font:700 11px Manrope,sans-serif;letter-spacing:0.01em;white-space:nowrap;" +
              (document.documentElement.classList.contains("dark")
                ? "color:#f3eee3;text-shadow:0 1px 3px rgba(0,0,0,0.9);"
                : "color:#211b10;text-shadow:0 1px 3px rgba(255,255,255,0.95);");
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
            icon: pinIcon(g, v.kind, false),
          });
          marker.addListener("click", () => onPinTap(v.id));
          markers.set(v.id, marker);
          labels.set(v.id, new PinLabel(v.coords, v.name));
          bounds.extend(v.coords);
        }
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
        }

        const syncLabels = () => {
          const show = (map.getZoom() ?? 0) >= LABEL_MIN_ZOOM;
          if (show === labelsOnRef.current) return;
          labelsOnRef.current = show;
          for (const l of labels.values()) l.setMap(show ? map : null);
        };
        map.addListener("zoom_changed", syncLabels);
        map.addListener("idle", syncLabels);
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

  // Theme flips restyle in place.
  useEffect(() => {
    mapRef.current?.setOptions({ styles: theme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE });
  }, [theme]);

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
      <div className="-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-1">
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
              <Icon name={f.icon} size={17} />
              {f.label}
            </button>
          );
        })}
      </div>
      <div className="card relative h-80 overflow-hidden min-[840px]:h-[420px]">
        <div ref={containerRef} className="h-full w-full" />
        {failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-2 text-muted">
            <Icon name="map" size={32} />
            <p className="text-sm font-semibold">Map couldn&apos;t load — venue lists below still work.</p>
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-4 text-2xs font-bold text-muted">
        <LegendDot color={PIN_COLORS.hotel} label="Hotels" />
        <LegendDot color={PIN_COLORS.bar} label="Bars" />
        <LegendDot color={PIN_COLORS.food} label="Food" />
      </div>
    </div>
  );
}

function pinIcon(g: typeof google, kind: VenueKind, focused: boolean): google.maps.Symbol {
  return {
    path: g.maps.SymbolPath.CIRCLE,
    fillColor: PIN_COLORS[kind],
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 2,
    scale: focused ? 11 : 8,
  };
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full border border-white/80"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
