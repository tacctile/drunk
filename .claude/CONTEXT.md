# Bar Hoppers — Project Context
> Single source of truth for all Claude Code sessions.
> Read this + index.html at the start of every session. Nothing else required unless specified.

---

## What This Is
A single-page HTML app for planning overnight bar-hop trips from Ralston, NE.
A group of friends use it to browse destinations, read trip details, vote on where to go, and mark the dates they're available.
Personal project — built solid and well-structured, not overcomplicated.

The perfect trip: drive to a city, check into a hotel steps from the bar district, walk to dinner, bar hop on foot, walk back to the hotel. Never touch the car. Every city is measured against that standard.

90%+ of usage is on a mobile phone. Desktop is a power-user upgrade — same data, more breathing room.

---

## Repo & Deploy
- GitHub: https://github.com/tacctile/drunk
- Deploy: GitHub Pages
- Supabase: https://tszssadgsxjoymcttlwd.supabase.co

---

## Architecture — Non-Negotiable Rules
1. ONE FILE — index.html contains all HTML, CSS, and JS. Never split into separate files.
2. No frameworks, no npm, no build step. Plain HTML/CSS/JS only. External resources via CDN only (Manrope, Material Symbols, Supabase JS client).
3. City data lives in the `const cities = [...]` array in index.html. The number of cities is variable — never hardcode counts or assume a fixed number.
4. Supabase is used for shared data only (votes, availability). All other state is localStorage. Supabase failures fall back to localStorage silently — never show errors for it.
5. Never break existing features — every session ends with all prior functionality still working.
6. Mobile-first. Think at 375px before finalizing any layout decision.
7. All user-provided strings (names) are escaped via `esc()` before any innerHTML use.

---

## Design System — Material 3
- **Font:** Manrope (Google Fonts CDN, weights 400/500/600/700/800)
- **Icons:** Material Symbols Outlined (Google Fonts CDN) — the ONLY icon system. No emoji, no SVG icons.
- **Color:** Full M3 color role set as CSS custom properties (`--primary`, `--on-primary`, `--primary-container`, `--secondary`, `--tertiary`, `--surface` + container ladder, `--on-surface`, `--surface-variant`, `--outline`, `--outline-variant`, `--error`, `--background`, etc.), amber/gold seed.
  - Dark (default): deep warm charcoal surfaces (`#15130e` family), amber primary `#f6c453`.
  - Light: warm off-whites (`#faf3e5` family), darker amber primary `#7a5900`.
  - `color-scheme: dark/light` set on `:root` per theme.
- **Theme:** dark default; light via header toggle; persisted to localStorage key `bh-theme` (raw string `dark`/`light`, applied pre-paint by an inline head script).
- **Radius scale (tighter than M3 defaults — the ONLY radii allowed):**
  `--radius-xs: 4px` (inputs, chips, calendar cells) · `--radius-sm: 6px` (buttons, text fields) · `--radius-md: 10px` (cards) · `--radius-lg: 14px` (dialogs, desktop detail panel) · `--radius-full: 9999px` (pills/circles only).
- **Pixel-perfect rules:**
  - Every interactive element (buttons, icon buttons, segmented buttons, nav items, text field, calendar day cells, FAB) is exactly `--control-h: 44px` tall.
  - 4px spacing grid — every padding/margin/gap is a multiple of 4px.
  - Type scale defined once as `font:` shorthand custom props (`--type-display/headline/title-lg/title/body-lg/body/label-lg/label/label-sm`). No inline font sizes.
  - Icon sizes via tokens: `--icon-nav: 24px`, `--icon-btn: 20px`, `--icon-meta: 16px`, `--icon-hero: 40px`.
- M3 state layers on buttons (hover 8% / press 12% overlays), elevation via `--shadow-1/2/3`.
- 160–200ms transitions; `prefers-reduced-motion` respected.
- Breakpoint: 840px — bottom nav bar becomes a left nav rail, cities view becomes two-pane (list + sticky detail panel).

---

## Supabase Schema
> Updated here whenever a table is created or modified. Also kept as a comment block at the top of the JS in index.html.

```sql
CREATE TABLE bh_votes (
  trip_id    text not null default 'current',
  voter_id   uuid not null,
  name       text not null check (char_length(name) between 1 and 20),
  city_id    text not null,
  updated_at timestamptz not null default now(),
  primary key (trip_id, voter_id)
);
ALTER TABLE bh_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY bh_votes_read   ON bh_votes FOR SELECT TO anon USING (true);
CREATE POLICY bh_votes_write  ON bh_votes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY bh_votes_update ON bh_votes FOR UPDATE TO anon USING (true);
CREATE POLICY bh_votes_delete ON bh_votes FOR DELETE TO anon USING (true);

CREATE TABLE bh_availability (
  id         uuid default gen_random_uuid() primary key,
  voter_id   uuid not null,
  name       text not null check (char_length(name) between 1 and 20),
  date       date not null,
  created_at timestamptz not null default now(),
  unique(voter_id, date)
);
ALTER TABLE bh_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY bh_avail_read   ON bh_availability FOR SELECT TO anon USING (true);
CREATE POLICY bh_avail_write  ON bh_availability FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY bh_avail_delete ON bh_availability FOR DELETE TO anon USING (true);
```

**Identity model:** `crypto.randomUUID()` generated on first visit → localStorage `bh-voter-id` (used as `voter_id` in both tables). Display name → localStorage `bh-voter-name` (asked once via dialog, changeable from the results view).

**localStorage keys:** `bh-theme`, `bh-voter-id`, `bh-voter-name`, `bh-cache-votes`, `bh-cache-avail` (the two caches double as the silent offline fallback store).

---

## Data Model
Each entry in `const cities = [...]` follows this exact shape (Sioux City is the reference implementation):
`{ id, name, state, miles, drive, mapCenter: { lat, lng }, mapZoom, hotels: [{ name, stars, priceRange, distanceNote, onSite, website, coords: { lat, lng } }], bars: [{ name, description, distance, coords }], food: [{ name, description, hours, coords }] }`
Bars render sorted by parsed `distance` (feet). Food renders in array order.
- The city-level `description` and `parking` fields have been REMOVED from the model and all rendering code. Do not add them back.
- `coords` were added to every hotel/bar/food entry (used for Google Maps pins). `mapCenter`/`mapZoom` set the initial map view (Sioux City: Fourth Street Historic District, zoom 15).

---

## Features — Current State

### Built
- [x] City list — card list with name, state, miles, drive time, live vote count; sort by distance (default) or A–Z
- [x] City detail — hero (name/state/miles/drive only — no description/parking), HOTELS (cards: stars, price, distance note, on-site, website link), BARS (distance-sorted list), FOOD (list with hours); full-screen with back button on mobile, sticky side panel on desktop
- [x] Google Maps integration — map below the hero (320px mobile / 420px ≥600px), custom dark + light map style JSON synced to the theme toggle, `gestureHandling: 'cooperative'` (no custom gesture overlay), default UI disabled, colored circle pins (hotels #E8A030 / bars #4CAF50 / food #2196F3) with white borders, three 44px filter chips above the map + Show All button, pin tap → M3 bottom sheet (`#poiScrim`/`#poiSheet`) with per-category content + hotel Visit Website button + Open in Maps button (all categories), list item tap (`data-poi="cat-idx"`) → map pans/zooms to pin + opens sheet without page scroll. Map only initializes in the visible container (panel on desktop, body on mobile); re-renders of the same city preserve center/zoom/filters; async Maps script handled by retry polling in `initCityMap`. On load: `fitBounds` auto-zooms to all pins with a `bounds_changed` listener that reduces zoom by 0.5 once for padding. Pin tap: shows dark semi-transparent overlay (`.map-dim-overlay`), selected pin scales up (scale 12), others dimmed (opacity 0.25); overlay and pin states reset on sheet close. `isFractionalZoomEnabled: true` on map instance.
- [x] Voting — one vote per person per trip (`trip_id: 'current'`); first vote prompts for name once; vote stored to Supabase `bh_votes` with silent localStorage fallback; changing city moves the vote; ranked results view with voter names, leader highlight, meters; name changeable from results view (updates both tables + caches)
- [x] ~~Vote tally FAB~~ — removed (redundant with Results nav tab)
- [x] Availability calendar — month view, prev/next nav, tap a future date to toggle yourself, per-date counts, day panel listing who's available; Supabase `bh_availability` with silent fallback; past dates disabled
- [x] Theme toggle — dark default / light, persisted to `bh-theme`, pre-paint application
- [x] Empty states (no cities, no votes, no city selected on desktop), skeleton loading on results, dialog validation
- [x] Mobile bottom nav (Cities / Results / Dates) → desktop left rail at 840px; two-pane cities view on desktop with auto-selected first city

### Backlog
- [ ] Replace placeholder Supabase anon key with the real key (current key's signature is `.placeholder` — all remote calls 401 and the app runs on localStorage fallback until then)
- [ ] Run the schema SQL above in the Supabase dashboard
- [ ] Add more cities to the `cities` array

---

## Current State
Last updated: 2026-06-11
Last change: Map UX overhaul — (1) removed two-finger overlay entirely (`.map-touch-hint` CSS + JS + HTML gone; `.gm-style-moc` suppression kept); (2) fitBounds on initial load with one-time `bounds_changed` zoom-0.5 padding listener; (3) selected pin highlight with dark overlay (`.map-dim-overlay`, z-index 2, rgba(0,0,0,0.5)), selected pin scales up (scale 12), others dimmed (fillOpacity 0.25), overlay clears on sheet close; (4) Open in Maps button (maps.google.com/?q=lat,lng) added to all three sheet types; (5) Show All button in filter row resets all chips to active and calls fitBounds. `isFractionalZoomEnabled: true` added to map instance.
Next up: paste real anon key, run schema SQL in Supabase, then add city #2 (must include coords/mapCenter/mapZoom)
