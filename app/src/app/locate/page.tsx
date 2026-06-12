"use client";

// LOCATE — live group map. Registered users only; everyone else gets the
// identity gate. Full-bleed dark map with a collapsible right-side people
// strip ("Show All" sticky on top, sharers A–Z below in their pin colors)
// and a single "Location Options" pill between the map and the bottom nav
// that opens a centered modal (drafted edits, Save/Cancel). Sharing is
// opt-in (off by default), expires after 72 hours, and only ever touches
// the v2_locations row — never device settings.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { NamePrompt } from "@/components/NamePrompt";
import type { Coords } from "@/data/types";
import { useGroupData } from "@/hooks/useGroupData";
import { useLocations, type LocationsValue } from "@/hooks/useLocations";
import { contrastColor } from "@/lib/colors";
import { BASE_MAP_OPTIONS, DARK_MAP_STYLE, loadGoogleMaps } from "@/lib/maps";
import type { LocationRow, VoterRow } from "@/lib/supabase";

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
    "position:absolute;transform:translate(-50%,-100%);padding:2px 6px;" +
    "border-radius:4px;background:rgba(10,13,20,0.9);color:#e8ecf4;" +
    "font-size:11px;line-height:16px;white-space:nowrap;pointer-events:none;";
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

interface SwitchProps {
  checked: boolean;
  onToggle: () => void;
  ariaLabel: string;
  disabled?: boolean;
}

/** Hand-built toggle — 44px tap target around a 40x24 track. */
function Switch({ checked, onToggle, ariaLabel, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onToggle}
      className="flex h-11 w-11 flex-none items-center justify-center disabled:opacity-50"
    >
      <span
        className={`relative h-6 w-10 rounded-full border transition ${
          checked ? "border-accent bg-accent" : "border-border-strong bg-raised"
        }`}
      >
        <span
          className={`absolute left-[2px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full transition ${
            checked ? "translate-x-4 bg-bg" : "bg-ink-muted"
          }`}
        />
      </span>
    </button>
  );
}

interface PeoplePanelProps {
  locations: LocationRow[];
  myId: string;
  onShowAll: () => void;
  onRowTap: (voterId: string) => void;
}

/**
 * Collapsible right-side strip over the map: a sticky "Show All" row on top
 * of the scrollable list (it never scrolls away), then every active sharer
 * A–Z. Each name row is filled with that person's auto-assigned pin color
 * (contrast text); your own row says "(you)" and wears a soft white outline.
 * Tapping a name flies the map to that person. A "Hide" bar at the bottom
 * collapses the strip to nothing; a small floating chevron on the map's
 * right edge brings it back.
 */
function PeoplePanel({ locations, myId, onShowAll, onRowTap }: PeoplePanelProps) {
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const sorted = useMemo(
    () => [...locations].sort((a, b) => a.display_name.localeCompare(b.display_name)),
    [locations],
  );

  return (
    <>
      <section
        aria-label="People sharing their location"
        aria-hidden={panelCollapsed}
        className={`absolute inset-y-0 right-0 z-10 flex flex-col overflow-hidden ${
          panelCollapsed ? "pointer-events-none w-0" : "w-[120px] border-l sm:w-[160px]"
        }`}
        style={{ background: "rgba(10, 13, 20, 0.85)", transition: "width 200ms ease" }}
      >
        <div className="relative min-h-0 flex-1 overflow-y-auto">
          {/* Show All — sticky so it never scrolls away */}
          <button
            type="button"
            onClick={onShowAll}
            className="sticky top-0 z-10 flex h-11 w-full items-center justify-center gap-1.5 border-b bg-raised"
          >
            <Icon name="zoom_out_map" size={16} className="text-accent" />
            <span className="text-label text-accent">Show All</span>
          </button>

          {sorted.length === 0 ? (
            <p className="flex h-11 items-center justify-center px-2 text-center text-label text-ink-dim">
              No one sharing
            </p>
          ) : (
            sorted.map((loc) => {
              const isMe = loc.voter_id === myId;
              return (
                <button
                  key={loc.voter_id}
                  type="button"
                  onClick={() => onRowTap(loc.voter_id)}
                  className="flex min-h-11 w-full items-center px-2"
                  style={{
                    background: loc.pin_color,
                    color: contrastColor(loc.pin_color),
                    // Your own row wears a soft white outline to stand out
                    // (inset so the scroll container can't clip it).
                    ...(isMe
                      ? {
                          outline: "1.5px solid rgba(255,255,255,0.4)",
                          outlineOffset: "-1.5px",
                        }
                      : undefined),
                  }}
                >
                  <span className="w-full truncate text-left text-label">
                    {loc.display_name}
                    {isMe ? " (you)" : ""}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Collapse — tuck the whole strip away */}
        <button
          type="button"
          onClick={() => setPanelCollapsed(true)}
          className="flex h-11 w-full flex-none items-center justify-center gap-1 border-t bg-raised"
        >
          <Icon name="chevron_right" size={20} className="text-ink-dim" />
          <span className="text-label text-ink-dim">Hide</span>
        </button>
      </section>

      {/* Floating expand handle — flush against the map's right edge */}
      {panelCollapsed && (
        <button
          type="button"
          onClick={() => setPanelCollapsed(false)}
          aria-label="Show people panel"
          className="absolute right-0 top-1/2 z-10 flex h-14 w-7 -translate-y-1/2 items-center justify-center border"
          style={{ background: "rgba(26, 31, 43, 0.9)", borderRadius: "6px 0 0 6px" }}
        >
          <Icon name="chevron_left" size={20} className="text-ink-dim" />
        </button>
      )}
    </>
  );
}

interface LocationOptionsModalProps {
  onClose: () => void;
  locations: LocationsValue;
  voters: VoterRow[];
  myId: string;
}

/**
 * The "Location Options" centered modal (replaced the old bottom sheet,
 * which kept getting stuck). Edits are drafted: the sharing toggle and the
 * "Who can see me" mute list copy the live values on open and nothing is
 * written until Save — toggleSharing if the switch moved, muteUser/
 * unmuteUser per changed row. Cancel, Escape, or tapping the scrim discards
 * the draft. If enabling sharing fails (permission denied / no fix), the
 * modal stays open with the inline error so the person sees why. Pin colors
 * are auto-assigned — there is no picker here.
 */
function LocationOptionsModal({ onClose, locations, voters, myId }: LocationOptionsModalProps) {
  const { isSharing, mutedIds, toggleSharing, muteUser, unmuteUser } = locations;
  // Drafts seeded from the live values — the modal mounts fresh per open.
  const [pendingSharing, setPendingSharing] = useState(isSharing);
  const [pendingMuted, setPendingMuted] = useState<string[]>(mutedIds);
  const [busy, setBusy] = useState(false);
  const [shareError, setShareError] = useState("");

  const others = useMemo(
    () =>
      voters
        .filter((v) => v.voter_id !== myId)
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
    // Mutes first so a share enabled in the same Save carries them.
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
        setPendingSharing(false); // sharing didn't start — reflect reality
        setBusy(false);
        return;
      }
    }
    setBusy(false);
    onClose();
  };

  return (
    <Dialog open onClose={handleCancel} title="Location Options">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base text-ink">Share my location</p>
        <Switch
          checked={pendingSharing}
          disabled={busy}
          onToggle={() => setPendingSharing((v) => !v)}
          ariaLabel="Share my location"
        />
      </div>
      <p className="text-meta font-normal text-ink-dim">
        This only affects Bar Hoppers. Your device location settings are unchanged.
      </p>
      {shareError && (
        <p className="mt-2 text-meta font-medium text-red" role="alert">
          {shareError}
        </p>
      )}

      {pendingSharing && (
        <div className="mt-5">
          <h3 className="label">Who can see me</h3>
          {others.length === 0 ? (
            <p className="py-2 text-meta font-normal text-ink-dim">
              No one else is registered yet.
            </p>
          ) : (
            <div className="max-h-[35vh] overflow-y-auto">
              {others.map((person) => {
                const canSeeMe = !pendingMuted.includes(person.id);
                return (
                  <div key={person.id} className="flex min-h-11 items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex-none rounded-full"
                      style={{ width: 20, height: 20, background: person.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-base text-ink">
                      {person.label}
                    </span>
                    <Switch
                      checked={canSeeMe}
                      disabled={busy}
                      onToggle={() =>
                        setPendingMuted((prev) =>
                          canSeeMe ? [...prev, person.id] : prev.filter((id) => id !== person.id),
                        )
                      }
                      ariaLabel={`${person.label} can see me`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          className="btn-accent w-full"
          disabled={busy}
          onClick={() => void handleSave()}
        >
          Save
        </button>
        <button
          type="button"
          className="flex h-11 w-full items-center justify-center text-base font-medium text-ink-muted transition hover:text-ink disabled:opacity-50"
          disabled={busy}
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>
    </Dialog>
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
 * The registered experience: a full-bleed map with the people strip overlaid
 * on its right edge, and the single "Location Options" pill in normal flow
 * between the map and the bottom nav — the same visual slot the sort pill
 * and vote button occupy elsewhere.
 */
function LocateScreen() {
  const { voterId, voters } = useGroupData();
  const locations = useLocations();
  const [command, setCommand] = useState<MapCommand | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const handleRowTap = useCallback((id: string) => {
    setCommand((prev) => ({ type: "fly", id, tick: (prev?.tick ?? 0) + 1 }));
  }, []);

  const handleShowAll = useCallback(() => {
    setCommand((prev) => ({ type: "showAll", tick: (prev?.tick ?? 0) + 1 }));
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] top-14 z-10 flex flex-col min-[840px]:bottom-0 min-[840px]:left-20">
      {/* Map fills everything above the options pill; the people panel
          overlays its right side. */}
      <div className="relative w-full min-h-0 flex-1">
        <LocateMap locations={locations.activeLocations} myId={voterId} command={command} />
        <PeoplePanel
          locations={locations.activeLocations}
          myId={voterId}
          onShowAll={handleShowAll}
          onRowTap={handleRowTap}
        />
      </div>

      {/* The single bottom control, between the map and the bottom nav. */}
      <div className="flex-none px-4 py-2">
        <div className="mx-auto max-w-2xl">
          <button type="button" className="btn-ghost w-full" onClick={() => setOptionsOpen(true)}>
            <Icon name="tune" size={20} />
            Location Options
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
        />
      )}
    </div>
  );
}

export default function LocatePage() {
  const { ready, name, identityInvalid } = useGroupData();
  // Registered = an identity on this device the live roster doesn't reject.
  // identityInvalid is the "stored id not found in v2_voters" signal; it
  // stays false offline so the screen keeps working from caches.
  const registered = Boolean(name) && !identityInvalid;

  if (!ready) return null; // settle silently — never a spinner
  if (!registered) return <LocateGate />;
  return <LocateScreen />;
}
