"use client";

// LOCATE — live group map. Registered users only; everyone else gets the
// identity gate. Full-bleed dark map with a collapsible right-side people
// panel ("Nearby Hopperz" header, sharers A–Z below with avatar rows)
// and a single "Location Options" pill between the map and the bottom nav
// that opens a centered modal (drafted edits, Save/Cancel). Sharing is ON
// by default for registered users (useLocations auto-starts it once; off is
// an explicit, persisted choice), expires after 72 hours, and only ever
// touches the v2_locations row — never device settings.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { NamePrompt } from "@/components/NamePrompt";
import { Switch } from "@/components/Switch";
import { SettingToggle } from "@/components/ui/SettingToggle";
import type { Coords } from "@/data/types";
import { useGroupData } from "@/hooks/useGroupData";
import { useLocations, type LocationsValue } from "@/hooks/useLocations";
import { useTripData } from "@/hooks/useTripData";
import { contrastColor, getInitials } from "@/lib/colors";
import { BASE_MAP_OPTIONS, DARK_MAP_STYLE, loadGoogleMaps } from "@/lib/maps";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { lsGet, lsSet } from "@/lib/storage";
import type { LocationRow, VoterRow } from "@/lib/supabase";

type DistanceUnit = "min" | "ft" | "yd" | "mi";
const DISTANCE_UNITS: { value: DistanceUnit; label: string }[] = [
  { value: "min", label: "Minutes" },
  { value: "ft", label: "Feet" },
  { value: "yd", label: "Yards" },
  { value: "mi", label: "Miles" },
];
const LS_DISTANCE_UNIT = "bh2-distance-unit";

const RALSTON: Coords = { lat: 41.172, lng: -96.1358 };
const DEFAULT_ZOOM = 8; // the general region
const FOCUS_ZOOM = 15; // a tapped person
const SHOW_ALL_ZOOM = 14; // Show All when exactly one person is sharing
const FIT_PADDING = 40; // px kept around the fitted bounds on Show All

// Circle scale is the radius in px: others 14px, you 18px + a 26px outer
// ring drawn in your own assigned pin color.
const PIN_SCALE = 7;
const ME_PIN_SCALE = 9;
const RING_SCALE = 13;
const PULSE_BUMP = 3; // +6px diameter while pulsing: a 14px pin grows to 20px
const PULSE_MS = 400;
const LABEL_LIFT = 14; // px between the pin center and the name pill

function pinIcon(color: string, scale: number): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 2,
  };
}

/** The outer ring around the current user's own pin — their assigned color. */
function ringIcon(color: string): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: RING_SCALE,
    fillColor: "#000000",
    fillOpacity: 0,
    strokeColor: color,
    strokeWeight: 2,
  };
}

/**
 * Name pill centered above a pin (always visible — this map has no zoom
 * gate). Never intercepts pointer events; `set` retargets it in place so
 * pins are updated, not torn down, on each realtime tick.
 */
function createNameLabel(text: string, coords: Coords) {
  const div = document.createElement("div");
  div.textContent = text;
  div.style.cssText =
    "position:absolute;transform:translate(-50%,-100%);padding:2px 8px;" +
    "border-radius:9999px;background:rgba(26,31,43,0.92);color:#e8ecf4;" +
    "font-size:12px;font-weight:600;line-height:16px;letter-spacing:0.05em;" +
    "white-space:nowrap;pointer-events:none;border:1px solid rgba(255,255,255,0.1);" +
    "box-shadow:0 2px 8px rgba(0,0,0,0.4);";
  let position = new google.maps.LatLng(coords.lat, coords.lng);
  const overlay = new google.maps.OverlayView();
  overlay.onAdd = () => {
    overlay.getPanes()?.floatPane.appendChild(div);
  };
  overlay.onRemove = () => {
    div.remove();
  };
  overlay.draw = () => {
    const projection = overlay.getProjection();
    if (!projection) return;
    const point = projection.fromLatLngToDivPixel(position);
    if (!point) return;
    div.style.left = `${point.x}px`;
    div.style.top = `${point.y - LABEL_LIFT}px`;
  };
  return {
    overlay,
    set(nextText: string, next: Coords) {
      div.textContent = nextText;
      position = new google.maps.LatLng(next.lat, next.lng);
      if (overlay.getProjection()) overlay.draw();
    },
  };
}

interface PersonPin {
  isMe: boolean;
  marker: google.maps.Marker;
  ring?: google.maps.Marker;
  label: ReturnType<typeof createNameLabel>;
  /** Pending reset of a tap pulse — cleared if the pin goes away first. */
  pulseTimer?: ReturnType<typeof setTimeout>;
}

interface MapCommand {
  type: "fly" | "showAll";
  /** The person to fly to — only for "fly". */
  id?: string;
  tick: number; // re-tapping the same control still re-triggers
}

interface LocateMapProps {
  locations: LocationRow[];
  myId: string;
  command: MapCommand | null;
}

/**
 * Full-bleed group map. Dark style, greedy gestures, person pins diffed by
 * voter id (updated in place, never recreated). Every pin fills with that
 * person's assigned pin_color; the current user's is larger with an outer
 * ring in the same color. If Maps can't load, the container stays a quiet
 * surface — never an error.
 */
function LocateMap({ locations, myId, command }: LocateMapProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const pinsRef = useRef<Map<string, PersonPin>>(new Map());
  const locationsRef = useRef(locations);
  locationsRef.current = locations;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !elRef.current) return;
        setMap(
          new g.maps.Map(elRef.current, {
            ...BASE_MAP_OPTIONS,
            gestureHandling: "greedy",
            styles: DARK_MAP_STYLE,
            center: RALSTON,
            zoom: DEFAULT_ZOOM,
          }),
        );
      })
      .catch(() => {
        // Maps unavailable — leave the quiet surface
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    const pins = pinsRef.current;
    const wanted = new Set(locations.map((l) => l.voter_id));
    for (const [id, pin] of pins) {
      if (wanted.has(id) && pin.isMe === (id === myId)) continue;
      if (pin.pulseTimer) clearTimeout(pin.pulseTimer);
      pin.marker.setMap(null);
      pin.ring?.setMap(null);
      pin.label.overlay.setMap(null);
      pins.delete(id);
    }
    for (const loc of locations) {
      const isMe = loc.voter_id === myId;
      const coords: Coords = { lat: loc.lat, lng: loc.lng };
      const labelText = isMe ? `You (${loc.display_name})` : loc.display_name;
      const scale = isMe ? ME_PIN_SCALE : PIN_SCALE;
      const existing = pins.get(loc.voter_id);
      if (existing) {
        existing.marker.setPosition(coords);
        existing.marker.setIcon(pinIcon(loc.pin_color, scale));
        existing.ring?.setPosition(coords);
        existing.ring?.setIcon(ringIcon(loc.pin_color));
        existing.label.set(labelText, coords);
        continue;
      }
      const marker = new google.maps.Marker({
        map,
        position: coords,
        title: labelText,
        clickable: false,
        icon: pinIcon(loc.pin_color, scale),
      });
      const ring = isMe
        ? new google.maps.Marker({
            map,
            position: coords,
            clickable: false,
            icon: ringIcon(loc.pin_color),
          })
        : undefined;
      const label = createNameLabel(labelText, coords);
      label.overlay.setMap(map);
      pins.set(loc.voter_id, { isMe, marker, ring, label });
    }
  }, [map, locations, myId]);

  // Panel commands. A name row flies to that person (zoom 15) and pulses
  // their pin once — grow the circle and let a timeout snap it back after
  // 400ms. Show All frames everyone: one sharer pans (zoom 14), two or more
  // fit bounds with padding, no one sharing is a no-op.
  useEffect(() => {
    if (!map || !command) return;
    const rows = locationsRef.current;
    if (command.type === "showAll") {
      if (rows.length === 0) return;
      if (rows.length === 1) {
        map.panTo({ lat: rows[0].lat, lng: rows[0].lng });
        map.setZoom(SHOW_ALL_ZOOM);
        return;
      }
      const bounds = new google.maps.LatLngBounds();
      for (const row of rows) bounds.extend({ lat: row.lat, lng: row.lng });
      map.fitBounds(bounds, FIT_PADDING);
      return;
    }
    const loc = rows.find((l) => l.voter_id === command.id);
    if (!loc) return;
    map.panTo({ lat: loc.lat, lng: loc.lng });
    map.setZoom(FOCUS_ZOOM);
    const pin = pinsRef.current.get(loc.voter_id);
    if (!pin) return;
    const baseScale = pin.isMe ? ME_PIN_SCALE : PIN_SCALE;
    if (pin.pulseTimer) clearTimeout(pin.pulseTimer);
    pin.marker.setIcon(pinIcon(loc.pin_color, baseScale + PULSE_BUMP));
    pin.pulseTimer = setTimeout(() => {
      pin.pulseTimer = undefined;
      pin.marker.setIcon(pinIcon(loc.pin_color, baseScale));
    }, PULSE_MS);
  }, [map, command]);

  // Clear every pin when the map instance goes away.
  useEffect(() => {
    if (!map) return;
    const pins = pinsRef.current;
    return () => {
      for (const pin of pins.values()) {
        if (pin.pulseTimer) clearTimeout(pin.pulseTimer);
        pin.marker.setMap(null);
        pin.ring?.setMap(null);
        pin.label.overlay.setMap(null);
      }
      pins.clear();
    };
  }, [map]);

  return (
    <div
      ref={elRef}
      role="img"
      aria-label="Map of everyone sharing their location"
      className="absolute inset-0 bg-surface"
    />
  );
}

/** Haversine distance in meters between two lat/lng pairs. */
function haversineMeters(a: Coords, b: Coords): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDistance(a: Coords, b: Coords, unit: DistanceUnit): string {
  const m = haversineMeters(a, b);
  switch (unit) {
    case "min": {
      // ~5 km/h walking pace
      const mins = Math.round(m / 83.33);
      return mins < 1 ? "<1 min" : `${mins} min`;
    }
    case "ft": {
      const ft = Math.round(m * 3.28084);
      return ft < 1000 ? `${ft} ft` : `${(ft / 1000).toFixed(1)}k ft`;
    }
    case "yd": {
      const yd = Math.round(m * 1.09361);
      return yd < 1760 ? `${yd} yd` : `${(yd / 1760).toFixed(1)} mi`;
    }
    case "mi": {
      const mi = m / 1609.344;
      return mi < 0.1 ? `${Math.round(m * 3.28084)} ft` : `${mi.toFixed(1)} mi`;
    }
  }
}

const PANEL_W = 148;

interface PeoplePanelProps {
  locations: LocationRow[];
  myId: string;
  myLocation: LocationRow | undefined;
  distanceUnit: DistanceUnit;
  onShowAll: () => void;
  onRowTap: (voterId: string) => void;
}

function PeoplePanel({
  locations,
  myId,
  myLocation,
  distanceUnit,
  onShowAll,
  onRowTap,
}: PeoplePanelProps) {
  const [open, setOpen] = useState(true);
  const { effectiveStatus } = useTripData();

  const sorted = useMemo(
    () => [...locations].sort((a, b) => a.display_name.localeCompare(b.display_name)),
    [locations],
  );

  return (
    <aside
      aria-label="People sharing their location"
      className="absolute top-0 right-0 h-full z-10 flex"
    >
      {/* Handle — always visible at the left edge of the aside */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Hide people panel" : "Show people panel"}
        className="flex h-16 w-8 flex-none items-center justify-center self-center rounded-l-card border-y border-l border-white/10 transition-colors hover:bg-white/10"
        style={{
          background: "rgba(18, 22, 31, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <Icon
          name={open ? "chevron_right" : "chevron_left"}
          size={20}
          className="text-ink-muted"
        />
      </button>

      {/* Panel content — collapses to 0 width */}
      <div
        className="flex flex-col overflow-hidden border-l border-white/10 transition-[width] duration-300 ease-out"
        style={{
          width: open ? PANEL_W : 0,
          background: "rgba(18, 22, 31, 0.82)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Header */}
        <div className="flex flex-none items-center justify-between px-3 py-3" style={{ minWidth: PANEL_W }}>
          <h2 className="text-[14px] font-bold leading-tight text-ink">Hopperz</h2>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-green">
            Live
          </span>
        </div>

        {/* Show All */}
        <button
          type="button"
          onClick={onShowAll}
          className="mx-2 mb-1 flex min-h-[40px] flex-none items-center gap-1.5 rounded-btn px-2 transition-colors hover:bg-white/5"
          style={{ minWidth: PANEL_W - 16 }}
        >
          <Icon name="zoom_out_map" size={16} className="text-accent" />
          <span className="text-[12px] font-bold text-accent">Show All</span>
        </button>

        {/* People list */}
        <div className="flex-1 overflow-y-auto px-1 pb-1" style={{ minWidth: PANEL_W }}>
          {sorted.length === 0 ? (
            <p className="py-4 text-center text-[12px] text-ink-dim">No one sharing</p>
          ) : (
            sorted.map((loc) => {
              const isMe = loc.voter_id === myId;
              const distText =
                isMe
                  ? "You"
                  : myLocation
                    ? formatDistance(
                        { lat: myLocation.lat, lng: myLocation.lng },
                        { lat: loc.lat, lng: loc.lng },
                        distanceUnit,
                      )
                    : "Sharing";
              return (
                <button
                  key={loc.voter_id}
                  type="button"
                  onClick={() => onRowTap(loc.voter_id)}
                  className="flex min-h-[40px] w-full items-center gap-2 rounded-btn px-1.5 transition-colors hover:bg-white/5"
                >
                  <div className="relative flex-none">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{
                        background: loc.pin_color,
                        color: contrastColor(loc.pin_color),
                      }}
                    >
                      {getInitials(loc.display_name)}
                    </div>
                    <div
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px]"
                      style={{
                        background: loc.pin_color,
                        borderColor: "rgba(18,22,31,0.82)",
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-[13px] font-bold leading-tight text-ink">
                      {loc.display_name}
                    </p>
                    <p className="text-[11px] leading-tight text-ink-muted">{distText}</p>
                  </div>
                  <Icon name="near_me" size={14} className="flex-none text-ink-dim" />
                </button>
              );
            })
          )}
        </div>

        {/* Active group card */}
        {effectiveStatus !== "planning" && (
          <div className="flex-none border-t border-white/5 px-2 py-2" style={{ minWidth: PANEL_W }}>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-ink-dim">
              Active Group
            </p>
            <div className="flex items-center gap-2 rounded-btn bg-white/5 p-1.5">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-btn bg-green/15">
                <Icon name="groups" size={18} className="text-green" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold leading-tight text-ink">Hoppz Crew</p>
                <p className="text-[11px] font-bold leading-tight text-green">
                  {effectiveStatus === "active" ? "In Progress" : "Upcoming"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

interface LocationOptionsModalProps {
  onClose: () => void;
  locations: LocationsValue;
  voters: VoterRow[];
  myId: string;
  distanceUnit: DistanceUnit;
  onDistanceUnitChange: (unit: DistanceUnit) => void;
}

function LocationOptionsModal({
  onClose,
  locations,
  voters,
  myId,
  distanceUnit,
  onDistanceUnitChange,
}: LocationOptionsModalProps) {
  const { isSharing, amDisabled, mutedIds, toggleSharing, muteUser, unmuteUser } = locations;
  const [pendingSharing, setPendingSharing] = useState(isSharing);
  const [pendingMuted, setPendingMuted] = useState<string[]>(mutedIds);
  const [pendingUnit, setPendingUnit] = useState<DistanceUnit>(distanceUnit);
  const [busy, setBusy] = useState(false);
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    lockBodyScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockBodyScroll();
    };
  }, [onClose]);

  const others = useMemo(
    () =>
      voters
        .filter((v) => v.voter_id !== myId && v.is_active !== false)
        .map((v) => {
          const fromLocation = locations.activeLocations.find(
            (l) => l.voter_id === v.voter_id,
          )?.pin_color;
          const color =
            fromLocation ?? locations.voterColors[v.voter_id] ?? v.pin_color ?? "#888";
          return { id: v.voter_id, label: v.display_name ?? v.name, color };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [voters, myId, locations.activeLocations, locations.voterColors],
  );

  const handleCancel = () => {
    if (busy) return;
    onClose();
  };

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    setShareError("");
    for (const id of pendingMuted) {
      if (!mutedIds.includes(id)) await muteUser(id);
    }
    for (const id of mutedIds) {
      if (!pendingMuted.includes(id)) await unmuteUser(id);
    }
    if (pendingSharing !== isSharing) {
      const result = await toggleSharing();
      if (result === "denied" || result === "error") {
        setShareError(
          result === "denied"
            ? "Location permission denied. Enable it in your browser settings."
            : "Couldn't get your location. Try again.",
        );
        setPendingSharing(false);
        setBusy(false);
        return;
      }
    }
    if (pendingUnit !== distanceUnit) {
      onDistanceUnitChange(pendingUnit);
    }
    setBusy(false);
    onClose();
  };

  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Location Settings"
        className="anim-rise w-full max-w-sm overflow-hidden rounded-[24px] border border-border bg-raised shadow-overlay"
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-display font-extrabold text-ink">Settings</h3>
            <button
              type="button"
              onClick={handleCancel}
              className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/5"
              aria-label="Close"
            >
              <Icon name="close" size={24} className="text-ink-muted" />
            </button>
          </div>

          {/* Toggles */}
          <div className="space-y-6">
            <SettingToggle
              icon="visibility"
              iconClassName="text-accent"
              iconBgClassName="bg-accent/10"
              title="Share Live Position"
              subtitle="Let the group see you"
              checked={pendingSharing}
              disabled={busy || amDisabled}
              dimmed={amDisabled}
              onToggle={() => setPendingSharing((v) => !v)}
              ariaLabel="Share live position"
            />

            {amDisabled && (
              <p className="text-meta font-normal text-ink-dim">
                Location sharing disabled by admin.
              </p>
            )}

            {shareError && (
              <p className="text-meta font-medium text-red" role="alert">
                {shareError}
              </p>
            )}

            {/* Distance unit picker */}
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-green/10">
                  <Icon name="straighten" size={20} className="text-green" />
                </div>
                <div>
                  <p className="text-base font-bold text-ink">Distance Display</p>
                  <p className="text-meta font-normal text-ink-muted">How distances appear</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 rounded-btn bg-surface p-1">
                {DISTANCE_UNITS.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    disabled={busy}
                    onClick={() => setPendingUnit(u.value)}
                    className={`flex h-9 items-center justify-center rounded-chip text-[12px] font-semibold transition ${
                      pendingUnit === u.value
                        ? "bg-accent text-bg"
                        : "text-ink-muted hover:bg-white/5"
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mute list when sharing is on */}
            {pendingSharing && others.length > 0 && (
              <div>
                <h4 className="label mb-3">Hide from</h4>
                <div className="max-h-[30vh] space-y-1 overflow-y-auto">
                  {others.map((person) => {
                    const isHidden = pendingMuted.includes(person.id);
                    return (
                      <div key={person.id} className="flex min-h-11 items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11px] font-bold"
                          style={{
                            background: person.color,
                            color: contrastColor(person.color),
                          }}
                        >
                          {getInitials(person.label)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-base text-ink">
                          {person.label}
                        </span>
                        <Switch
                          checked={isHidden}
                          disabled={busy}
                          onToggle={() =>
                            setPendingMuted((prev) =>
                              isHidden
                                ? prev.filter((id) => id !== person.id)
                                : [...prev, person.id],
                            )
                          }
                          ariaLabel={`Hide from ${person.label}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Save button */}
          <button
            type="button"
            className="mt-8 flex h-14 w-full items-center justify-center rounded-card bg-ink font-bold text-bg transition active:scale-[0.97] disabled:opacity-50"
            disabled={busy}
            onClick={() => void handleSave()}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

/** Unregistered visitors: a quiet gate into the identity prompt. */
function LocateGate() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="mx-auto flex max-w-2xl justify-center px-4 pt-16">
        <div className="card flex w-full max-w-sm flex-col items-center gap-3 text-center">
          <Icon name="person_pin" size={40} className="text-ink-dim" />
          <h1 className="text-title font-bold text-ink">Identity required</h1>
          <p className="text-meta font-normal text-ink-muted">
            Create your identity to share and see locations.
          </p>
          <button type="button" className="btn-accent w-full" onClick={() => setOpen(true)}>
            Create identity
          </button>
        </div>
      </div>
      <NamePrompt open={open} flow="new" onCancel={() => setOpen(false)} onDone={() => setOpen(false)} />
    </>
  );
}

/**
 * The registered experience: a full-bleed map with the people panel overlaid
 * on its right side, and a floating "Location Options" pill above the bottom nav.
 */
function LocateScreen() {
  const { voterId, voters } = useGroupData();
  const locations = useLocations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusVoterId = searchParams.get("focus");
  const [command, setCommand] = useState<MapCommand | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const focusHandledRef = useRef(false);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(
    () => (lsGet(LS_DISTANCE_UNIT) as DistanceUnit) || "min",
  );

  const handleDistanceUnitChange = useCallback((unit: DistanceUnit) => {
    setDistanceUnit(unit);
    lsSet(LS_DISTANCE_UNIT, unit);
  }, []);

  const myLocation = useMemo(
    () => locations.activeLocations.find((l) => l.voter_id === voterId),
    [locations.activeLocations, voterId],
  );

  useEffect(() => {
    if (!focusVoterId || focusHandledRef.current) return;
    const tryFocus = () => {
      const target = locations.activeLocations.find((l) => l.voter_id === focusVoterId);
      if (target) {
        focusHandledRef.current = true;
        setCommand((prev) => ({ type: "fly", id: focusVoterId, tick: (prev?.tick ?? 0) + 1 }));
        router.replace("/social/locate", { scroll: false });
      }
    };
    if (locations.activeLocations.length > 0) {
      tryFocus();
      if (focusHandledRef.current) return;
    }
    const timer = setTimeout(() => {
      if (!focusHandledRef.current) {
        focusHandledRef.current = true;
        tryFocus();
        router.replace("/social/locate", { scroll: false });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [focusVoterId, locations.activeLocations, router]);

  const handleRowTap = useCallback((id: string) => {
    setCommand((prev) => ({ type: "fly", id, tick: (prev?.tick ?? 0) + 1 }));
  }, []);

  const handleShowAll = useCallback(() => {
    setCommand((prev) => ({ type: "showAll", tick: (prev?.tick ?? 0) + 1 }));
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] top-14 z-10 flex flex-col min-[840px]:bottom-0 min-[840px]:left-20">
      {/* Map fills everything; people panel overlays right side. */}
      <div className="relative w-full min-h-0 flex-1">
        <LocateMap locations={locations.activeLocations} myId={voterId} command={command} />
        <PeoplePanel
          locations={locations.activeLocations}
          myId={voterId}
          myLocation={myLocation}
          distanceUnit={distanceUnit}
          onShowAll={handleShowAll}
          onRowTap={handleRowTap}
        />

        {/* Floating Location Options pill */}
        <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
          <button
            type="button"
            onClick={() => setOptionsOpen(true)}
            className="flex h-11 items-center gap-2 rounded-full bg-accent px-6 font-bold text-bg shadow-overlay transition active:scale-95"
          >
            <Icon name="share_location" size={20} />
            <span className="text-base font-bold">Location Options</span>
          </button>
        </div>
      </div>

      {/* Mounted only while open so the drafts copy fresh values each time. */}
      {optionsOpen && (
        <LocationOptionsModal
          onClose={() => setOptionsOpen(false)}
          locations={locations}
          voters={voters}
          myId={voterId}
          distanceUnit={distanceUnit}
          onDistanceUnitChange={handleDistanceUnitChange}
        />
      )}
    </div>
  );
}

function LocatePageInner() {
  const { ready, name, identityInvalid } = useGroupData();
  const registered = Boolean(name) && !identityInvalid;

  if (!ready) return null;
  if (!registered) return <LocateGate />;
  return <LocateScreen />;
}

export default function LocatePage() {
  return (
    <Suspense>
      <LocatePageInner />
    </Suspense>
  );
}
