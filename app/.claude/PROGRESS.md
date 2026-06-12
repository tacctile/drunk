# PROGRESS

Legend: [x] complete · [~] partial · [ ] pending

## Foundation
- [x] Next.js 14 App Router + TypeScript strict scaffold in /app (own package.json, own ecosystem)
- [x] Tailwind v3 with CSS-variable design tokens (4px grid, 44px interactive height, 160ms ease)
- [x] Manrope (400–800) + Material Symbols Outlined via Google Fonts CDN
- [x] Dark only — no light variables, no theme toggle, no boot script, no light Maps style
- [x] prefers-reduced-motion respected (all animation collapses)
- [x] Mobile-first; desktop ≥840px gets an 80px icon rail + push layout on city detail
- [x] Tabular numerals globally (font-variant-numeric on body)

## Data
- [x] 27-city dataset with HARDCODED walkability research: walkScore (0–100), walkGrade (A+…F), district name
- [x] City type slimmed to id/name/state/miles/drive/walkScore/walkGrade/district/mapCenter/mapZoom
- [x] Legacy hotel/bar/food/vibes/tagline arrays retained in cities.ts as reference only (out of the type, never read by UI)
- [x] Venue lists read ONLY from the curated v2_hotels/v2_bars/v2_food Supabase tables (Places Nearby Search removed)
- [x] Map pin coords geocoded in the background by name + address (3 concurrent, session-cached, silent skip) — lists never block on pins
- [x] Silent failure handling: Supabase error → empty state, geocode failure → no pin (no error UI anywhere)

## Supabase
- [x] v2 user tables (v2_voters, v2_city_votes, v2_hotel_votes, v2_availability) + anon RLS — live
- [x] v2_hotel_votes in place_id shape: PK (voter_id, city_id), hotel_place_id, hotel_name
- [x] Curated venue fallback tables v2_hotels/v2_bars/v2_food (anon read, ~206 rows) — live
- [x] All four user tables in supabase_realtime publication; single channel, debounced refetch, refetch on focus
- [x] Silent localStorage fallback for every read and write (six bh2-* keys, no error UI)

## Identity
- [x] UUID per device (bh2-voter-id) generated on first visit
- [x] "What's your name?" dialog (Save/Cancel, first name, max 20 chars) on first vote or first calendar tap
- [x] useNameGate() — every identifying write funnels through it; never asked again once set

## Views
- [x] CITIES (first screen): walkability index — 72px rows: name + state + district · score (display, grade color) + grade badge · miles + drive · 44px inline vote icon
- [x] Sticky column header row on /cities (CITY / WALKABILITY / DISTANCE / VOTE, 36px, opaque, below the wordmark bar, aligned to the row grid)
- [x] Sort pill above bottom nav → bottom sheet: Distance from Ralston (default) / Walkability Score / City Name A–Z / By State (grouped sections); persisted to bh2-city-sort
- [x] CITY DETAIL: fully opaque sticky header (back / name + state / vote icon), 280–380px dark map, cooperative gestures, circle pins (hotel accent / bar green / food blue) + zoom-gated OverlayView name labels (zoom ≥ 15), pin tap → venue sheet (name, plain address, descriptor)
- [x] Hotels / Bars / Food tab bar (44px, accent indicator) over Supabase-fed lists; hotel rows carry star icons + price_range + "prefer this hotel" radio (one per user per city, v2_hotels uuid keyed); bar/food rows carry curated descriptors + has_food/has_bar pills
- [x] Full-width vote CTA above the nav: "Vote for X" ↔ "Your pick — X ✓" (tap to undo), optimistic
- [x] CALENDAR: personal only — tap cycles available → not available → clear; check/X icons in cells, today ring, past dates dimmed/disabled, green/red legend; upsert/delete to v2_availability
- [x] THE BOARD: hot-dates heat map (respondent-share buckets, yes/total fractions, month nav, tap → who's in/out sheet) + standings (rank, count, accent meter, voter pills, hotel preference sub-rows) + empty state
- [x] / → /cities redirect (server redirect + page fallback); 404 for unknown city ids
- [x] ZERO external links — venue addresses are plain text everywhere (rows + pin sheet)
- [x] LOCATE (fourth tab, rightmost): registered-only gate → full-screen dark map (Ralston, zoom 8, greedy), realtime person pins (14px + name pill; own 18px + amber ring), opt-in share toggle (off by default, 72h expiry, 60s updates, device-settings disclaimer, denied-permission inline error), 10-color pin picker (persisted), one-directional mute list, draggable people panel (80px ↔ 50vh, "Last updated X min ago", row tap pans+pulses pin)
- [x] ADMIN (3s long-press on the Locate nav icon — the only entry): user cards w/ hashed-PIN status + last vote, edit modal (rename / PIN reset / cascade delete), Reset All Votes + Reset All Availability behind confirms, active-location list w/ Force expire, data-health count grid w/ refresh
- [x] v2_locations table live (anon read gated to unexpired rows, in supabase_realtime); useLocations hook filters expiry + mutes client-side

## Guardrails honored
- [x] Root index.html untouched; all work inside /app
- [x] No UI component libraries; no spinners on writes; no Supabase errors surfaced
- [x] No walk strips / constellation maps / score circles / tier pills / vibe tags / Trip tab
- [x] No hardcoded venue lists; walkability never calculated
- [x] React JSX escaping for all user strings

## Backlog
- [ ] Vercel deploy (root dir app/) + env vars + Maps key domain restriction
- [ ] Confirm Geocoding API (and Maps JavaScript API) enabled with billing on the production key — Places can be disabled
- [ ] Spot-check geocode hit-rate for venues with sparse/missing addresses (no pin = silent)
- [ ] Per-city availability (current model is one shared group calendar — matches v1)
