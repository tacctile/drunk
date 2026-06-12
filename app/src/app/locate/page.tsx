"use client";

// LOCATE — live group map. Registered users only; everyone else gets the
// identity gate. Sharing is opt-in (off by default), expires after 72 hours,
// and only ever touches the v2_locations row — never device settings.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Icon } from "@/components/Icon";
import { NamePrompt } from "@/components/NamePrompt";
import type { Coords } from "@/data/types";
import { useGroupData } from "@/hooks/useGroupData";
import { PIN_PALETTE, useLocations, type LocationsValue } from "@/hooks/useLocations";
import { BASE_MAP_OPTIONS, DARK_MAP_STYLE, loadGoogleMaps } from "@/lib/maps";
import type { LocationRow, VoterRow } from "@/lib/supabase";

const RALSTON: Coords = { lat: 41.172, lng: -96.1358 };
const DEFAULT_ZOOM = 8; // the general region
const FOCUS_ZOOM = 14; // a tapped person

// Circle scale is the radius in px: others 14px, you 18px + a 22px accent ring.
const PIN_SCALE = 7;
const ME_PIN_SCALE = 9;
const RING_SCALE = 11;
const LABEL_LIFT = 14; // px between the pin center and the name pill

const PANEL_COLLAPSED = 80; // drag handle + first row

function formatAgo(iso: string, nowMs: number): string {
  const mins = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)} hr ago`;
}

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

/** The amber ring around the current user's own pin. */
function ringIcon(): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: RING_SCALE,
    fillColor: "#000000",
    fillOpacity: 0,
    strokeColor: "#FF8C42",
    strokeWeight: 2,
  };
}

/** One pulse — scale up and back over 400ms — when a list row focuses a pin. */
function pulseMarker(marker: google.maps.Marker, color: string, baseScale: number) {
  const start = performance.now();
  const step = (t: number) => {
    const p = Math.min((t - start) / 400, 1);
    const wave = Math.sin(p * Math.PI); // 0 → 1 → 0
    marker.setIcon(pinIcon(color, baseScale * (1 + 0.4 * wave)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
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
}

interface FlyTo {
  id: string;
  tick: number; // re-tapping the same row still re-triggers
}

interface LocateMapProps {
  locations: LocationRow[];
  myId: string;
  flyTo: FlyTo | null;
  onPinTap: (voterId: string) => void;
}

/**
 * Full-screen group map. Dark style, greedy gestures, person pins diffed by
 * voter id (updated in place, never recreated). The current user's pin is
 * larger with an amber ring; everyone else is a 14px dot in their color.
 * If Maps can't load, the container stays a quiet surface — never an error.
 */
function LocateMap({ locations, myId, flyTo, onPinTap }: LocateMapProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const pinsRef = useRef<Map<string, PersonPin>>(new Map());
  const locationsRef = useRef(locations);
  locationsRef.current = locations;
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
        existing.label.set(labelText, coords);
        continue;
      }
      const id = loc.voter_id;
      const marker = new google.maps.Marker({
        map,
        position: coords,
        title: labelText,
        icon: pinIcon(loc.pin_color, scale),
      });
      marker.addListener("click", () => tapRef.current(id));
      const ring = isMe
        ? new google.maps.Marker({ map, position: coords, clickable: false, icon: ringIcon() })
        : undefined;
      const label = createNameLabel(labelText, coords);
      label.overlay.setMap(map);
      pins.set(id, { isMe, marker, ring, label });
    }
  }, [map, locations, myId]);

  // Tapped list row: pan + zoom to the person, pulse their pin once.
  useEffect(() => {
    if (!map || !flyTo) return;
    const loc = locationsRef.current.find((l) => l.voter_id === flyTo.id);
    if (!loc) return;
    map.panTo({ lat: loc.lat, lng: loc.lng });
    map.setZoom(FOCUS_ZOOM);
    const pin = pinsRef.current.get(flyTo.id);
    if (pin) pulseMarker(pin.marker, loc.pin_color, pin.isMe ? ME_PIN_SCALE : PIN_SCALE);
  }, [map, flyTo]);

  // Clear every pin when the map instance goes away.
  useEffect(() => {
    if (!map) return;
    const pins = pinsRef.current;
    return () => {
      for (const pin of pins.values()) {
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

interface ControlsCardProps {
  locations: LocationsValue;
  voters: VoterRow[];
  myId: string;
}

/** Sharing toggle + disclaimer, pin color picker (while on), mute list. */
function ControlsCard({ locations, voters, myId }: ControlsCardProps) {
  const { isSharing, pinColor, mutedIds, toggleSharing, updatePinColor, muteUser, unmuteUser } =
    locations;
  const [busy, setBusy] = useState(false);
  const [shareError, setShareError] = useState("");
  const [muteOpen, setMuteOpen] = useState(false);

  const others = useMemo(
    () =>
      voters
        .filter((v) => v.voter_id !== myId)
        .map((v) => ({ id: v.voter_id, label: v.display_name ?? v.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [voters, myId],
  );

  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);
    setShareError("");
    const result = await toggleSharing();
    if (result === "denied") {
      setShareError("Location permission denied. Enable it in your browser settings.");
    } else if (result === "error") {
      setShareError("Couldn't get your location. Try again.");
    }
    setBusy(false);
  };

  return (
    <section className="rounded-t-card border-t bg-surface p-4" aria-label="Location sharing controls">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base text-ink">Share my location</p>
          <p className="mt-0.5 text-meta font-normal text-ink-dim">
            This only affects Bar Hoppers. Your device location settings are unchanged.
          </p>
        </div>
        <Switch
          checked={isSharing}
          disabled={busy}
          onToggle={() => void handleToggle()}
          ariaLabel="Share my location"
        />
      </div>
      {shareError && (
        <p className="mt-2 text-meta font-medium text-red" role="alert">
          {shareError}
        </p>
      )}

      {isSharing && (
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Pin color">
          {PIN_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={pinColor === color}
              aria-label={`Pin color ${color}`}
              onClick={() => void updatePinColor(color)}
              className={`h-8 w-8 rounded-full transition ${
                pinColor === color ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : ""
              }`}
              style={{ background: color }}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setMuteOpen((o) => !o)}
        aria-expanded={muteOpen}
        className="mt-1 flex h-11 w-full items-center justify-between text-base text-ink"
      >
        Manage visibility
        <Icon name={muteOpen ? "expand_less" : "expand_more"} size={22} className="text-ink-muted" />
      </button>
      {muteOpen && (
        <div className="max-h-44 overflow-y-auto">
          <p className="pb-1 text-meta font-normal text-ink-dim">
            Hide your location from specific people. They won&apos;t know.
          </p>
          {others.length === 0 ? (
            <p className="py-2 text-meta font-normal text-ink-dim">No one else is registered yet.</p>
          ) : (
            others.map((person) => {
              const hidden = mutedIds.includes(person.id);
              return (
                <div key={person.id} className="flex min-h-11 items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-base text-ink">{person.label}</span>
                  <Switch
                    checked={hidden}
                    onToggle={() => void (hidden ? unmuteUser(person.id) : muteUser(person.id))}
                    ariaLabel={`Hide my location from ${person.label}`}
                  />
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}

interface PeoplePanelProps {
  locations: LocationRow[];
  myId: string;
  now: number;
  highlightedId: string | null;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  onRowTap: (voterId: string) => void;
}

/**
 * Always-partially-visible bottom sheet: collapsed to the drag handle + the
 * first row (80px), draggable (or tappable) up to half the viewport. Your
 * own row sorts first with a "(you)" suffix.
 */
function PeoplePanel({
  locations,
  myId,
  now,
  highlightedId,
  expanded,
  setExpanded,
  onRowTap,
}: PeoplePanelProps) {
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const startYRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const expandedHeight = () =>
    Math.round((typeof window !== "undefined" ? window.innerHeight : 800) / 2);
  const baseHeight = expanded ? expandedHeight() : PANEL_COLLAPSED;
  const height =
    dragOffset === null
      ? baseHeight
      : Math.min(Math.max(baseHeight - dragOffset, PANEL_COLLAPSED), expandedHeight());

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    startYRef.current = e.clientY;
    setDragOffset(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragOffset === null) return;
    setDragOffset(e.clientY - startYRef.current);
  };
  const onPointerUp = () => {
    if (dragOffset === null) return;
    if (Math.abs(dragOffset) < 8) setExpanded(!expanded); // a tap toggles
    else if (dragOffset < -40) setExpanded(true);
    else if (dragOffset > 40) setExpanded(false);
    setDragOffset(null);
  };

  // A tapped map pin highlights its row — make sure it's on screen.
  useEffect(() => {
    if (!highlightedId) return;
    listRef.current
      ?.querySelector(`[data-voter="${highlightedId}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightedId]);

  return (
    <section
      aria-label="People sharing their location"
      className="flex flex-col border-t bg-surface"
      style={{ height, transition: dragOffset === null ? "height 160ms ease" : "none" }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={expanded ? "Collapse people list" : "Expand people list"}
        className="flex h-6 flex-none cursor-grab items-center justify-center"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        <div className="h-1 w-10 rounded-full bg-border-strong" />
      </div>

      {locations.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-4 text-center text-meta font-normal text-ink-muted">
          No one is sharing their location right now.
        </p>
      ) : (
        <div
          ref={listRef}
          className={`min-h-0 flex-1 px-4 ${expanded ? "overflow-y-auto" : "overflow-hidden"}`}
        >
          {locations.map((loc) => {
            const isMe = loc.voter_id === myId;
            const highlighted = highlightedId === loc.voter_id;
            return (
              <button
                key={loc.voter_id}
                type="button"
                data-voter={loc.voter_id}
                onClick={() => onRowTap(loc.voter_id)}
                className={`flex h-14 w-full items-center gap-3 rounded-btn text-left transition ${
                  highlighted ? "bg-accent-dim" : "bg-surface"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 flex-none rounded-full"
                  style={{ background: loc.pin_color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-title text-ink">
                    {loc.display_name}
                    {isMe && <span className="text-meta font-normal text-ink-muted"> (you)</span>}
                  </span>
                  <span className="block text-meta font-normal text-ink-dim">
                    Last updated {formatAgo(loc.updated_at, now)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
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

/** The registered experience: map + controls + people panel. */
function LocateScreen() {
  const { voterId, voters } = useGroupData();
  const locations = useLocations();
  const [flyTo, setFlyTo] = useState<FlyTo | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Pin tap: the map stays put — the list highlights that person instead.
  const handlePinTap = useCallback((id: string) => {
    setHighlightedId(id);
    setExpanded(true);
  }, []);

  const handleRowTap = useCallback((id: string) => {
    setFlyTo((prev) => ({ id, tick: (prev?.tick ?? 0) + 1 }));
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] top-14 z-10 min-[840px]:bottom-0 min-[840px]:left-20">
      <LocateMap
        locations={locations.activeLocations}
        myId={voterId}
        flyTo={flyTo}
        onPinTap={handlePinTap}
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <ControlsCard locations={locations} voters={voters} myId={voterId} />
        <PeoplePanel
          locations={locations.activeLocations}
          myId={voterId}
          now={locations.now}
          highlightedId={highlightedId}
          expanded={expanded}
          setExpanded={setExpanded}
          onRowTap={handleRowTap}
        />
      </div>
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
